-- ============================================================
-- SQL Query to Check Orphaned Consents
-- Run this in Supabase SQL Editor
-- ============================================================
-- Link orphaned consents to their intakes by matching session_id patterns
-- First, let's see what we have
SELECT 
  c.id as consent_id,
  c.session_id,
  c.client_intake_id,
  i.id as intake_id,
  i.case_id
FROM rc_client_consents c
LEFT JOIN rc_client_intakes i ON c.client_intake_id = i.id
ORDER BY c.created_at DESC
LIMIT 20;
