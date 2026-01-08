-- ============================================================
-- SQL Queries to Check Attorney Assignment for Intakes
-- Run these in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- STEP 1: Find recent intakes that need attorney attestation
-- ============================================================
-- This will show you intakes that are pending attorney confirmation
SELECT 
  id, 
  case_id, 
  intake_status, 
  attorney_attested_at, 
  attorney_confirm_deadline_at,
  created_at,
  intake_submitted_at
FROM rc_client_intakes
WHERE intake_status = 'submitted_pending_attorney'
ORDER BY created_at DESC
LIMIT 5;

-- Copy the case_id from the results above and use it in STEP 2


-- ============================================================
-- STEP 2: Check if the case has an attorney assigned
-- ============================================================
-- Replace '<case-id-from-step-1>' with an actual case_id from STEP 1
SELECT 
  c.id as case_id,
  c.attorney_id,
  c.case_status,
  c.created_at as case_created_at,
  u.id as rc_user_id,
  u.auth_user_id,
  u.email,
  u.full_name,
  u.role
FROM rc_cases c
LEFT JOIN rc_users u ON c.attorney_id = u.id
WHERE c.id = '<case-id-from-step-1>';

-- If attorney_id is NULL or doesn't match your attorney, that's the problem!


-- ============================================================
-- STEP 3: Check the logged-in attorney's rc_users record
-- ============================================================
-- Replace '<your-attorney-email>' with your actual attorney email
SELECT 
  id as rc_user_id,
  auth_user_id,
  email,
  full_name,
  role,
  created_at
FROM rc_users
WHERE email = '<your-attorney-email>'
  AND role = 'attorney';

-- Copy the 'id' (rc_user_id) from this result - it should match attorney_id in STEP 2


-- ============================================================
-- STEP 4: Combined query to check everything at once
-- ============================================================
-- This shows intakes with their case attorney assignments in one query
-- Replace '<your-attorney-email>' with your actual email
SELECT 
  i.id as intake_id,
  i.case_id,
  i.intake_status,
  i.attorney_attested_at,
  i.attorney_confirm_deadline_at,
  i.created_at as intake_created_at,
  c.attorney_id as case_attorney_id,
  u.id as attorney_rc_user_id,
  u.email as attorney_email,
  u.full_name as attorney_name,
  CASE 
    WHEN u.email = '<your-attorney-email>' THEN '✅ YOUR INTAKE'
    ELSE '❌ Other attorney'
  END as assignment_status
FROM rc_client_intakes i
INNER JOIN rc_cases c ON i.case_id = c.id
LEFT JOIN rc_users u ON c.attorney_id = u.id
WHERE i.intake_status = 'submitted_pending_attorney'
ORDER BY i.created_at DESC
LIMIT 10;


-- ============================================================
-- STEP 5: Check if your attorney can see the intake (mine scope)
-- ============================================================
-- Replace '<your-attorney-email>' and '<case-id-from-step-1>'
-- This simulates what AttorneyIntakeTracker does for "mine" scope
WITH attorney_info AS (
  SELECT id as rc_user_id, auth_user_id, email
  FROM rc_users
  WHERE email = '<your-attorney-email>'
    AND role = 'attorney'
)
SELECT 
  i.id as intake_id,
  i.case_id,
  i.intake_status,
  c.attorney_id as case_attorney_id,
  ai.rc_user_id as your_rc_user_id,
  CASE 
    WHEN c.attorney_id = ai.rc_user_id THEN '✅ MATCH - Will show in "mine"'
    WHEN c.attorney_id IS NULL THEN '❌ NULL - Case has no attorney assigned'
    ELSE '❌ MISMATCH - Assigned to different attorney'
  END as visibility_status
FROM rc_client_intakes i
INNER JOIN rc_cases c ON i.case_id = c.id
CROSS JOIN attorney_info ai
WHERE i.case_id = '<case-id-from-step-1>';


-- ============================================================
-- BONUS: Find all intakes with missing attorney assignments
-- ============================================================
-- Shows intakes where the case has no attorney_id set
SELECT 
  i.id as intake_id,
  i.case_id,
  i.intake_status,
  i.created_at,
  c.attorney_id,
  CASE 
    WHEN c.attorney_id IS NULL THEN '❌ NO ATTORNEY ASSIGNED'
    ELSE '✅ Has attorney'
  END as status
FROM rc_client_intakes i
INNER JOIN rc_cases c ON i.case_id = c.id
WHERE i.intake_status IN ('submitted_pending_attorney', 'draft')
ORDER BY i.created_at DESC;
