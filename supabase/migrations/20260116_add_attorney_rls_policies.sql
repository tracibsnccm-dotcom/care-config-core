-- Migration: Add RLS policies to allow attorneys to query rc_cases and rc_client_intakes
-- This fixes the issue where attorney queries were hanging due to RLS blocking access.
--
-- The previous migration (20251206) blocked attorneys from direct rc_cases access,
-- but we now need to allow direct queries with proper RLS enforcement.

-- ===========================
-- 1. Enable RLS on rc_cases (if not already enabled)
-- ===========================

ALTER TABLE rc_cases ENABLE ROW LEVEL SECURITY;

-- ===========================
-- 2. Drop existing policy that blocks attorneys and create new one
-- ===========================

-- Drop the existing policy that explicitly blocks attorneys
DROP POLICY IF EXISTS "rc_cases_select_by_role" ON rc_cases;

-- Create new policy: Attorneys can SELECT cases where attorney_id matches their rc_users.id
-- This allows direct queries to rc_cases while maintaining security
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
        -- RN CM / Supervisor can see all cases (Phase 1 simplification)
        OR u.role IN ('rn_cm', 'supervisor')
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
      )
  )
);

-- ===========================
-- 3. Enable RLS on rc_client_intakes (if not already enabled)
-- ===========================

ALTER TABLE rc_client_intakes ENABLE ROW LEVEL SECURITY;

-- ===========================
-- 4. Drop existing intake policies and recreate with attorney access
-- ===========================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "rc_client_intakes_select_by_case_access" ON rc_client_intakes;
DROP POLICY IF EXISTS "rc_client_intakes_update_by_authorized" ON rc_client_intakes;

-- SELECT policy: Attorneys can see intakes for cases they're assigned to
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

-- UPDATE policy: Attorneys can update intakes for cases they're assigned to (for attestation)
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

-- ===========================
-- 5. Comments for documentation
-- ===========================

COMMENT ON POLICY "rc_cases_select_by_role" ON rc_cases IS 
'Attorneys can SELECT cases where attorney_id = their rc_users.id. RN CMs and supervisors can see all cases. Clients can see their own cases.';

COMMENT ON POLICY "rc_client_intakes_select_by_case_access" ON rc_client_intakes IS 
'Attorneys can SELECT intakes for cases where attorney_id = their rc_users.id. Authorization is checked by joining through rc_cases.';

COMMENT ON POLICY "rc_client_intakes_update_by_authorized" ON rc_client_intakes IS 
'Attorneys can UPDATE intakes for cases where attorney_id = their rc_users.id (for attestation). Clients can update their own intakes. RN CMs can update any intake.';
