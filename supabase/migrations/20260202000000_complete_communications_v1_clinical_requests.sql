-- Complete Communications v1: rc_case_requests and rc_case_request_updates
-- Minimal setup for fetch/insert during testing. No final RLS hardening.

-- -----------------------------
-- A) rc_case_requests
-- -----------------------------
CREATE TABLE IF NOT EXISTS rc_case_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES rc_cases(id) ON DELETE CASCADE,
  created_by_user_id UUID,
  created_by_role TEXT NOT NULL CHECK (created_by_role IN ('attorney', 'rn', 'system')),
  request_type TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESPONDED', 'CLOSED')),
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ
);

-- -----------------------------
-- B) rc_case_request_updates
-- -----------------------------
CREATE TABLE IF NOT EXISTS rc_case_request_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES rc_case_requests(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES rc_cases(id) ON DELETE CASCADE,
  author_user_id UUID,
  author_role TEXT NOT NULL CHECK (author_role IN ('attorney', 'rn', 'system')),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------
-- Indexes (only these two per spec)
-- -----------------------------
CREATE INDEX IF NOT EXISTS idx_rc_case_requests_case_updated
  ON rc_case_requests(case_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_rc_case_request_updates_request_created
  ON rc_case_request_updates(request_id, created_at ASC);

-- -----------------------------
-- Trigger: updated_at on rc_case_requests
-- -----------------------------
CREATE OR REPLACE FUNCTION rc_case_requests_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_rc_case_requests_updated_at ON rc_case_requests;
CREATE TRIGGER tr_rc_case_requests_updated_at
  BEFORE UPDATE ON rc_case_requests
  FOR EACH ROW
  EXECUTE FUNCTION rc_case_requests_set_updated_at();

-- -----------------------------
-- Minimal RLS (required for fetch/insert during testing)
-- -----------------------------
ALTER TABLE rc_case_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rc_case_request_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for rc_case_requests" ON rc_case_requests;
CREATE POLICY "Allow all for rc_case_requests" ON rc_case_requests
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for rc_case_request_updates" ON rc_case_request_updates;
CREATE POLICY "Allow all for rc_case_request_updates" ON rc_case_request_updates
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON rc_case_requests TO anon;
GRANT ALL ON rc_case_requests TO authenticated;
GRANT ALL ON rc_case_request_updates TO anon;
GRANT ALL ON rc_case_request_updates TO authenticated;
