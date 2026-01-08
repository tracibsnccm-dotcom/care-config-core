-- Migration: Add comprehensive RLS policies for data isolation
-- This ensures attorneys can only see their cases, clients can only see their cases,
-- and rc_client_intakes access is controlled through rc_cases authorization.
--
-- Security: Even if someone bypasses the UI, they cannot access data they shouldn't see.

-- ===========================
-- 1. Update rc_cases policies for client access
-- ===========================

-- Drop existing policy to recreate with client support
DROP POLICY IF EXISTS "rc_cases_select_by_role" ON rc_cases;

-- New policy: Attorneys see only their cases, Clients see only their cases, RN/supervisors see all
CREATE POLICY "rc_cases_select_by_role"
ON rc_cases
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM rc_users u
    WHERE u.auth_user_id = auth.uid()
      AND (
        -- Attorney can see cases where they are the assigned attorney
        (u.role = 'attorney' AND rc_cases.attorney_id = u.id)
        -- Client can see cases where they are the client
        OR (
          u.role = 'client'
          AND EXISTS (
            SELECT 1
            FROM rc_clients c
            WHERE c.id = rc_cases.client_id
              AND c.user_id = u.id
          )
        )
        -- RN CM / Supervisor can see all cases (Phase 1 simplification inside your org)
        OR u.role IN ('rn_cm', 'supervisor')
        -- Provider can see cases they are assigned to (if provider_id column exists in future)
        -- For now, providers may need case access through other mechanisms
      )
  )
);

-- ===========================
-- 2. RLS policies for rc_client_intakes
-- ===========================

-- Enable RLS on rc_client_intakes (if not already enabled)
ALTER TABLE rc_client_intakes ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can only see intakes for cases they have access to
-- This joins through rc_cases to check authorization
CREATE POLICY "rc_client_intakes_select_by_case_access"
ON rc_client_intakes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM rc_users u
    WHERE u.auth_user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM rc_cases c
        WHERE c.id = rc_client_intakes.case_id
          AND (
            -- Attorney can see intakes for their cases
            (u.role = 'attorney' AND c.attorney_id = u.id)
            -- Client can see intakes for their cases
            OR (
              u.role = 'client'
              AND EXISTS (
                SELECT 1
                FROM rc_clients cl
                WHERE cl.id = c.client_id
                  AND cl.user_id = u.id
              )
            )
            -- RN CM / Supervisor can see all intakes
            OR u.role IN ('rn_cm', 'supervisor')
          )
      )
  )
);

-- INSERT policy: Clients can create intakes for their own cases
CREATE POLICY "rc_client_intakes_insert_by_client"
ON rc_client_intakes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM rc_users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role = 'client'
      AND EXISTS (
        SELECT 1
        FROM rc_cases c
        WHERE c.id = rc_client_intakes.case_id
          AND EXISTS (
            SELECT 1
            FROM rc_clients cl
            WHERE cl.id = c.client_id
              AND cl.user_id = u.id
          )
      )
  )
);

-- UPDATE policy: 
-- - Clients can update their own intakes (if still in draft or submitted)
-- - Attorneys can update intakes for their cases (for attestation)
-- - RN CMs can update intakes for cases they manage
CREATE POLICY "rc_client_intakes_update_by_authorized"
ON rc_client_intakes
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM rc_users u
    WHERE u.auth_user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM rc_cases c
        WHERE c.id = rc_client_intakes.case_id
          AND (
            -- Client can update intakes for their cases
            (
              u.role = 'client'
              AND EXISTS (
                SELECT 1
                FROM rc_clients cl
                WHERE cl.id = c.client_id
                  AND cl.user_id = u.id
              )
            )
            -- Attorney can update intakes for their cases (for attestation)
            OR (u.role = 'attorney' AND c.attorney_id = u.id)
            -- RN CM / Supervisor can update intakes
            OR u.role IN ('rn_cm', 'supervisor')
          )
      )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM rc_users u
    WHERE u.auth_user_id = auth.uid()
      AND EXISTS (
        SELECT 1
        FROM rc_cases c
        WHERE c.id = rc_client_intakes.case_id
          AND (
            -- Client can update intakes for their cases
            (
              u.role = 'client'
              AND EXISTS (
                SELECT 1
                FROM rc_clients cl
                WHERE cl.id = c.client_id
                  AND cl.user_id = u.id
              )
            )
            -- Attorney can update intakes for their cases (for attestation)
            OR (u.role = 'attorney' AND c.attorney_id = u.id)
            -- RN CM / Supervisor can update intakes
            OR u.role IN ('rn_cm', 'supervisor')
          )
      )
  )
);

-- DELETE policy: Only RN CMs / Supervisors can delete intakes (soft delete via deleted_at)
-- Clients and attorneys should not directly delete intakes
CREATE POLICY "rc_client_intakes_delete_by_rn"
ON rc_client_intakes
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM rc_users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('rn_cm', 'supervisor')
  )
);

-- ===========================
-- 3. Comments for documentation
-- ===========================

COMMENT ON POLICY "rc_cases_select_by_role" ON rc_cases IS 
'Attorneys see only cases where attorney_id = their rc_users.id. Clients see only cases where client_id links to their rc_users.id via rc_clients. RN CMs and supervisors see all cases.';

COMMENT ON POLICY "rc_client_intakes_select_by_case_access" ON rc_client_intakes IS 
'Users can only see intakes for cases they have access to. Authorization is checked by joining through rc_cases.';

COMMENT ON POLICY "rc_client_intakes_insert_by_client" ON rc_client_intakes IS 
'Only clients can create intakes, and only for their own cases (verified through rc_cases -> rc_clients -> rc_users).';

COMMENT ON POLICY "rc_client_intakes_update_by_authorized" ON rc_client_intakes IS 
'Clients can update their own intakes. Attorneys can update intakes for their cases (for attestation). RN CMs can update any intake.';

COMMENT ON POLICY "rc_client_intakes_delete_by_rn" ON rc_client_intakes IS 
'Only RN CMs and supervisors can delete intakes. In practice, this should be a soft delete via deleted_at column.';
