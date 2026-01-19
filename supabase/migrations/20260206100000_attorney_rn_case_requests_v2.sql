-- Attorney <-> RN Case-Linked Requests and Activity Feed (v2)
-- Replaces rc_case_requests + rc_case_request_updates with:
--   rc_case_requests (title, body, status: open/responded/closed, last_activity_at)
--   rc_case_request_messages (threaded messages)
--   rc_case_activity (unified "All Activity" feed)
--
-- RLS reuses existing case access: rc_users.auth_user_id = auth.uid(),
-- attorney via rc_cases.attorney_id = rc_users.id; RN access is restricted to roles rn and rn_supervisor only.
-- Idempotent where feasible: DROP IF EXISTS before create.

-- -----------------------------
-- 1) Drop old policies and triggers (only if tables exist; idempotent for fresh DBs)
-- -----------------------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rc_case_requests') THEN
    DROP POLICY IF EXISTS "Allow all for rc_case_requests" ON rc_case_requests;
    DROP TRIGGER IF EXISTS tr_rc_case_requests_updated_at ON rc_case_requests;
    DROP TRIGGER IF EXISTS tr_rc_case_requests_set_updated_at ON rc_case_requests;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rc_case_request_updates') THEN
    DROP POLICY IF EXISTS "Allow all for rc_case_request_updates" ON rc_case_request_updates;
  END IF;
END $$;

-- -----------------------------
-- 2) Drop old tables (order: children first)
-- -----------------------------
DROP TABLE IF EXISTS rc_case_request_updates;
DROP TABLE IF EXISTS rc_case_requests;

-- -----------------------------
-- 3) rc_case_requests (new schema)
-- -----------------------------
CREATE TABLE rc_case_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES rc_cases(id) ON DELETE CASCADE,
  created_by_user_id uuid NOT NULL,  -- auth.users id
  created_by_role text NOT NULL CHECK (created_by_role IN ('attorney','rn')),
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','responded','closed')),
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rc_case_requests_case_last_activity
  ON rc_case_requests(case_id, last_activity_at DESC);

-- -----------------------------
-- 4) rc_case_request_messages (threaded messages)
-- -----------------------------
CREATE TABLE rc_case_request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES rc_case_requests(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES rc_cases(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,  -- auth.users id
  sender_role text NOT NULL CHECK (sender_role IN ('attorney','rn')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rc_case_request_messages_request_created
  ON rc_case_request_messages(request_id, created_at ASC);

-- -----------------------------
-- 5) rc_case_activity (unified "All Activity" feed)
-- -----------------------------
CREATE TABLE rc_case_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES rc_cases(id) ON DELETE CASCADE,
  actor_user_id uuid,
  actor_role text CHECK (actor_role IN ('attorney','rn','system')),
  activity_type text NOT NULL,  -- 'request_created','request_message','request_closed','request_reopened'
  ref_table text,
  ref_id uuid,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rc_case_activity_case_created
  ON rc_case_activity(case_id, created_at DESC);

-- -----------------------------
-- 6) Trigger: updated_at on rc_case_requests
-- -----------------------------
CREATE OR REPLACE FUNCTION rc_case_requests_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_rc_case_requests_updated_at
  BEFORE UPDATE ON rc_case_requests
  FOR EACH ROW
  EXECUTE FUNCTION rc_case_requests_set_updated_at();

-- -----------------------------
-- 7) Trigger: on INSERT rc_case_requests -> rc_case_activity (request_created)
-- -----------------------------
CREATE OR REPLACE FUNCTION rc_case_requests_after_insert_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rc_case_activity (case_id, actor_user_id, actor_role, activity_type, ref_table, ref_id, summary)
  VALUES (
    NEW.case_id,
    NEW.created_by_user_id,
    NEW.created_by_role,
    'request_created',
    'rc_case_requests',
    NEW.id,
    'Request: ' || left(NEW.title, 120) || CASE WHEN length(NEW.title) > 120 THEN '…' ELSE '' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_rc_case_requests_after_insert_activity
  AFTER INSERT ON rc_case_requests
  FOR EACH ROW
  EXECUTE FUNCTION rc_case_requests_after_insert_activity();

-- -----------------------------
-- 8) Trigger: on INSERT rc_case_request_messages
--   - update rc_case_requests.last_activity_at = now()
--   - if sender_role = 'rn' and request.status = 'open' -> set status = 'responded'
--   - insert rc_case_activity (request_message)
-- -----------------------------
CREATE OR REPLACE FUNCTION rc_case_request_messages_after_insert()
RETURNS TRIGGER AS $$
DECLARE
  v_status text;
  v_title text;
BEGIN
  UPDATE rc_case_requests
  SET last_activity_at = now()
  WHERE id = NEW.request_id;

  SELECT status, title INTO v_status, v_title FROM rc_case_requests WHERE id = NEW.request_id;

  IF NEW.sender_role = 'rn' AND v_status = 'open' THEN
    UPDATE rc_case_requests SET status = 'responded' WHERE id = NEW.request_id;
  END IF;

  INSERT INTO rc_case_activity (case_id, actor_user_id, actor_role, activity_type, ref_table, ref_id, summary)
  VALUES (
    NEW.case_id,
    NEW.sender_user_id,
    NEW.sender_role,
    'request_message',
    'rc_case_request_messages',
    NEW.id,
    (CASE WHEN NEW.sender_role = 'rn' THEN 'RN replied' ELSE 'Attorney replied' END) || ' on: ' || left(v_title, 80) || CASE WHEN length(v_title) > 80 THEN '…' ELSE '' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_rc_case_request_messages_after_insert
  AFTER INSERT ON rc_case_request_messages
  FOR EACH ROW
  EXECUTE FUNCTION rc_case_request_messages_after_insert();

-- -----------------------------
-- 9) Trigger: on UPDATE rc_case_requests.status -> rc_case_activity (request_closed / request_reopened)
-- -----------------------------
CREATE OR REPLACE FUNCTION rc_case_requests_after_update_status_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'closed' THEN
      INSERT INTO rc_case_activity (case_id, actor_user_id, actor_role, activity_type, ref_table, ref_id, summary)
      VALUES (NEW.case_id, auth.uid(), 'attorney', 'request_closed', 'rc_case_requests', NEW.id,
        'Request closed: ' || left(NEW.title, 100) || CASE WHEN length(NEW.title) > 100 THEN '…' ELSE '' END);
    ELSIF NEW.status = 'open' THEN
      INSERT INTO rc_case_activity (case_id, actor_user_id, actor_role, activity_type, ref_table, ref_id, summary)
      VALUES (NEW.case_id, auth.uid(), 'attorney', 'request_reopened', 'rc_case_requests', NEW.id,
        'Request reopened: ' || left(NEW.title, 100) || CASE WHEN length(NEW.title) > 100 THEN '…' ELSE '' END);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_rc_case_requests_after_update_status_activity
  AFTER UPDATE OF status ON rc_case_requests
  FOR EACH ROW
  EXECUTE FUNCTION rc_case_requests_after_update_status_activity();

-- -----------------------------
-- 10) RLS: rc_case_requests
-- Attorney: select/insert/update for cases where rc_cases.attorney_id = rc_users.id (u.auth_user_id = auth.uid()).
-- RN access is restricted to roles rn and rn_supervisor only. RN cannot update (no close/reopen).
-- -----------------------------
ALTER TABLE rc_case_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rc_case_requests_select"
  ON rc_case_requests FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM rc_users u
      WHERE u.auth_user_id = auth.uid()
        AND (
          (u.role = 'attorney' AND EXISTS (SELECT 1 FROM rc_cases c WHERE c.id = rc_case_requests.case_id AND c.attorney_id = u.id))
          OR u.role IN ('rn', 'rn_supervisor')
        )
    )
  );

CREATE POLICY "rc_case_requests_insert_attorney"
  ON rc_case_requests FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by_user_id = auth.uid()
    AND created_by_role = 'attorney'
    AND EXISTS (
      SELECT 1 FROM rc_users u
      JOIN rc_cases c ON c.id = rc_case_requests.case_id AND c.attorney_id = u.id
      WHERE u.auth_user_id = auth.uid() AND u.role = 'attorney'
    )
  );

-- Attorney-only UPDATE (for close/reopen).
CREATE POLICY "rc_case_requests_update_attorney"
  ON rc_case_requests FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM rc_users u
      JOIN rc_cases c ON c.id = rc_case_requests.case_id AND c.attorney_id = u.id
      WHERE u.auth_user_id = auth.uid() AND u.role = 'attorney'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM rc_users u
      JOIN rc_cases c ON c.id = rc_case_requests.case_id AND c.attorney_id = u.id
      WHERE u.auth_user_id = auth.uid() AND u.role = 'attorney'
    )
  );

-- -----------------------------
-- 11) RLS: rc_case_request_messages
-- Attorney and RN: select/insert for cases they can access.
-- RN access is restricted to roles rn and rn_supervisor only.
-- -----------------------------
ALTER TABLE rc_case_request_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rc_case_request_messages_select"
  ON rc_case_request_messages FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM rc_users u
      WHERE u.auth_user_id = auth.uid()
        AND (
          (u.role = 'attorney' AND EXISTS (SELECT 1 FROM rc_cases c WHERE c.id = rc_case_request_messages.case_id AND c.attorney_id = u.id))
          OR u.role IN ('rn', 'rn_supervisor')
        )
    )
  );

CREATE POLICY "rc_case_request_messages_insert"
  ON rc_case_request_messages FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND sender_user_id = auth.uid()
    AND sender_role IN ('attorney', 'rn')
    AND EXISTS (
      SELECT 1 FROM rc_users u
      WHERE u.auth_user_id = auth.uid()
        AND (
          (u.role = 'attorney' AND sender_role = 'attorney' AND EXISTS (SELECT 1 FROM rc_cases c WHERE c.id = rc_case_request_messages.case_id AND c.attorney_id = u.id))
          OR (u.role IN ('rn', 'rn_supervisor') AND sender_role = 'rn')
        )
    )
  );

-- -----------------------------
-- 12) RLS: rc_case_activity
-- Select only (inserts done by triggers). Same case-access as above.
-- RN access is restricted to roles rn and rn_supervisor only.
-- -----------------------------
ALTER TABLE rc_case_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rc_case_activity_select"
  ON rc_case_activity FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM rc_users u
      WHERE u.auth_user_id = auth.uid()
        AND (
          (u.role = 'attorney' AND EXISTS (SELECT 1 FROM rc_cases c WHERE c.id = rc_case_activity.case_id AND c.attorney_id = u.id))
          OR u.role IN ('rn', 'rn_supervisor')
        )
    )
  );

-- -----------------------------
-- 13) Grants
-- -----------------------------
GRANT ALL ON rc_case_requests TO authenticated;
GRANT ALL ON rc_case_request_messages TO authenticated;
GRANT ALL ON rc_case_activity TO authenticated;

COMMENT ON TABLE rc_case_requests IS 'Attorney-initiated case-linked requests to RN; status open/responded/closed.';
COMMENT ON TABLE rc_case_request_messages IS 'Threaded messages on a request (attorney and RN).';
COMMENT ON TABLE rc_case_activity IS 'Unified activity feed for a case (request_created, request_message, request_closed, request_reopened).';
