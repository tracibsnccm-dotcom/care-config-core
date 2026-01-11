-- Migration: Add RLS policies for attorneys and RNs to read rc_client_consents
-- This allows the ConsentDocumentViewer component to work in Attorney and RN portals

-- Add SELECT policy for attorneys to read consents for their cases
CREATE POLICY "Attorneys can read consents for their cases"
ON rc_client_consents
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM rc_users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role = 'attorney'
      AND EXISTS (
        SELECT 1
        FROM rc_client_intakes ci
        JOIN rc_cases c ON c.id = ci.case_id
        WHERE ci.id = rc_client_consents.client_intake_id
          AND c.attorney_id = u.id
      )
  )
);

-- Add SELECT policy for RN CMs and supervisors to read all consents
CREATE POLICY "RN CMs and supervisors can read all consents"
ON rc_client_consents
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM rc_users u
    WHERE u.auth_user_id = auth.uid()
      AND u.role IN ('rn_cm', 'supervisor')
  )
);

COMMENT ON POLICY "Attorneys can read consents for their cases" ON rc_client_consents IS 
'Attorneys can SELECT consents for intakes associated with cases where attorney_id = their rc_users.id';

COMMENT ON POLICY "RN CMs and supervisors can read all consents" ON rc_client_consents IS 
'RN CMs and supervisors can SELECT all consents to view/print for any case';
