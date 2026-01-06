-- Migration: Add case revision fields and create attorney view for released/closed cases only
-- This enforces that attorneys can only access released/closed cases, never drafts

-- ===========================
-- Step 1: Add revision and lifecycle fields to rc_cases
-- ===========================

-- Add revision_of_case_id to track case revision chains
ALTER TABLE rc_cases
ADD COLUMN IF NOT EXISTS revision_of_case_id uuid REFERENCES rc_cases(id) ON DELETE SET NULL;

-- Add case_status field if it doesn't exist (it may already exist as 'case_status' but we need to ensure it supports 'draft','released','closed')
-- Check if case_status exists and update its constraint
DO $$
BEGIN
  -- If case_status doesn't exist, add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rc_cases' AND column_name = 'case_status'
  ) THEN
    ALTER TABLE rc_cases ADD COLUMN case_status text;
  END IF;
  
  -- Update case_status to support workflow statuses if it's currently used for something else
  -- We'll add a check constraint to ensure valid values
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'rc_cases' 
    AND constraint_name = 'rc_cases_case_status_check'
  ) THEN
    ALTER TABLE rc_cases 
    ADD CONSTRAINT rc_cases_case_status_check 
    CHECK (case_status IS NULL OR case_status IN ('draft', 'released', 'closed', 'open', 'hold'));
  END IF;
END $$;

-- Add released_at timestamp
ALTER TABLE rc_cases
ADD COLUMN IF NOT EXISTS released_at timestamptz;

-- Add closed_at timestamp
ALTER TABLE rc_cases
ADD COLUMN IF NOT EXISTS closed_at timestamptz;

-- Add updated_at if it doesn't exist
ALTER TABLE rc_cases
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_rc_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_rc_cases_updated_at_trigger ON rc_cases;
CREATE TRIGGER update_rc_cases_updated_at_trigger
  BEFORE UPDATE ON rc_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_rc_cases_updated_at();

-- ===========================
-- Step 2: Create helper function to find root case in revision chain
-- ===========================

CREATE OR REPLACE FUNCTION get_case_root_id(case_id uuid)
RETURNS uuid AS $$
DECLARE
  current_id uuid := case_id;
  parent_id uuid;
BEGIN
  -- Walk up the revision chain to find the root
  LOOP
    SELECT revision_of_case_id INTO parent_id
    FROM rc_cases
    WHERE id = current_id;
    
    -- If no parent, we've reached the root
    EXIT WHEN parent_id IS NULL;
    
    current_id := parent_id;
  END LOOP;
  
  RETURN current_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================
-- Step 3: Create VIEW for attorneys showing only latest released/closed cases
-- ===========================

CREATE OR REPLACE VIEW attorney_latest_final_cases AS
WITH RECURSIVE case_lineage AS (
  -- Find all root cases (cases with no revision_of_case_id)
  SELECT 
    id,
    id as root_id,
    revision_of_case_id,
    0 as depth
  FROM rc_cases
  WHERE revision_of_case_id IS NULL
  
  UNION ALL
  
  -- Recursively find all descendants
  SELECT 
    c.id,
    cl.root_id,
    c.revision_of_case_id,
    cl.depth + 1
  FROM rc_cases c
  INNER JOIN case_lineage cl ON c.revision_of_case_id = cl.id
),
final_cases AS (
  -- Get all released/closed cases with their root_id
  SELECT
    c.*,
    cl.root_id
  FROM rc_cases c
  INNER JOIN case_lineage cl ON c.id = cl.id
  WHERE c.case_status IN ('released', 'closed')
),
ranked_final_cases AS (
  -- Rank final cases by timestamp priority: closed_at > released_at > updated_at > created_at
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY root_id
      ORDER BY
        COALESCE(closed_at, '1970-01-01'::timestamptz) DESC NULLS LAST,
        COALESCE(released_at, '1970-01-01'::timestamptz) DESC NULLS LAST,
        COALESCE(updated_at, '1970-01-01'::timestamptz) DESC NULLS LAST,
        COALESCE(created_at, '1970-01-01'::timestamptz) DESC NULLS LAST
    ) as rn
  FROM final_cases
)
-- Select only the most recent released/closed case per root
SELECT
  id,
  client_id,
  attorney_id,
  case_type,
  case_status,
  date_of_injury,
  jurisdiction,
  revision_of_case_id,
  released_at,
  closed_at,
  updated_at,
  created_at,
  root_id
FROM ranked_final_cases
WHERE rn = 1;

-- Grant SELECT access to the view for authenticated users
-- Attorneys will use this view instead of rc_cases directly
GRANT SELECT ON attorney_latest_final_cases TO authenticated;

-- ===========================
-- Step 4: Update RLS policies to restrict attorney access
-- ===========================

-- Drop the existing attorney SELECT policy on rc_cases
DROP POLICY IF EXISTS "rc_cases_select_by_role" ON rc_cases;

-- Create new policy: Attorneys are BLOCKED from direct rc_cases access
-- RN/supervisors can still access rc_cases directly (including drafts)
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
        -- RN CM / Supervisor can see all cases (including drafts)
        u.role IN ('rn_cm', 'supervisor')
        -- Attorneys are EXPLICITLY blocked - they must use attorney_latest_final_cases view
      )
      -- Explicitly exclude attorneys from direct table access
      AND u.role != 'attorney'
  )
);

-- Create a security definer function that attorneys can use to query their cases
-- This ensures attorneys can only see their own cases and only released/closed ones
CREATE OR REPLACE FUNCTION attorney_accessible_cases()
RETURNS TABLE (
  id uuid,
  client_id uuid,
  attorney_id uuid,
  case_type text,
  case_status text,
  date_of_injury date,
  jurisdiction text,
  revision_of_case_id uuid,
  released_at timestamptz,
  closed_at timestamptz,
  updated_at timestamptz,
  created_at timestamptz
) AS $$
BEGIN
  -- Verify user is an attorney
  IF NOT EXISTS (
    SELECT 1 FROM rc_users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'attorney'
  ) THEN
    RETURN;
  END IF;
  
  -- Return latest final cases for this attorney
  RETURN QUERY
  SELECT
    alc.id,
    alc.client_id,
    alc.attorney_id,
    alc.case_type,
    alc.case_status,
    alc.date_of_injury,
    alc.jurisdiction,
    alc.revision_of_case_id,
    alc.released_at,
    alc.closed_at,
    alc.updated_at,
    alc.created_at
  FROM attorney_latest_final_cases alc
  INNER JOIN rc_users u ON u.id = alc.attorney_id
  WHERE u.auth_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION attorney_accessible_cases() TO authenticated;

-- Helper function: Resolve any case ID to its latest final version (for attorneys)
-- This is useful when you have a case ID (possibly a draft) and need to get
-- the latest released/closed version in the same revision chain
CREATE OR REPLACE FUNCTION resolve_attorney_case(case_id_param uuid)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  attorney_id uuid,
  case_type text,
  case_status text,
  date_of_injury date,
  jurisdiction text,
  revision_of_case_id uuid,
  released_at timestamptz,
  closed_at timestamptz,
  updated_at timestamptz,
  created_at timestamptz
) AS $$
DECLARE
  root_id_val uuid;
BEGIN
  -- Verify user is an attorney
  IF NOT EXISTS (
    SELECT 1 FROM rc_users u
    WHERE u.auth_user_id = auth.uid() AND u.role = 'attorney'
  ) THEN
    RETURN;
  END IF;
  
  -- Find the root of the revision chain for the provided case_id
  SELECT get_case_root_id(case_id_param) INTO root_id_val;
  
  IF root_id_val IS NULL THEN
    RETURN;
  END IF;
  
  -- Return the latest final case for this root (if accessible to this attorney)
  -- The view already has one row per root_id with the latest final case
  RETURN QUERY
  SELECT
    alc.id,
    alc.client_id,
    alc.attorney_id,
    alc.case_type,
    alc.case_status,
    alc.date_of_injury,
    alc.jurisdiction,
    alc.revision_of_case_id,
    alc.released_at,
    alc.closed_at,
    alc.updated_at,
    alc.created_at
  FROM attorney_latest_final_cases alc
  INNER JOIN rc_users u ON u.id = alc.attorney_id
  WHERE u.auth_user_id = auth.uid()
    AND alc.root_id = root_id_val
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION resolve_attorney_case(uuid) TO authenticated;

-- ===========================
-- Step 5: Add index for performance
-- ===========================

CREATE INDEX IF NOT EXISTS idx_rc_cases_revision_of_case_id ON rc_cases(revision_of_case_id);
CREATE INDEX IF NOT EXISTS idx_rc_cases_case_status ON rc_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_rc_cases_released_at ON rc_cases(released_at);
CREATE INDEX IF NOT EXISTS idx_rc_cases_attorney_id ON rc_cases(attorney_id);

-- ===========================
-- Comments
-- ===========================

COMMENT ON COLUMN rc_cases.revision_of_case_id IS 'References the parent case this case revises. NULL for root cases.';
COMMENT ON COLUMN rc_cases.case_status IS 'Workflow status: draft (unreleased), released, or closed. Attorneys can only see released/closed.';
COMMENT ON COLUMN rc_cases.released_at IS 'Timestamp when case was released. Used to determine latest released version.';
COMMENT ON COLUMN rc_cases.closed_at IS 'Timestamp when case was closed. Used to determine latest closed version.';
COMMENT ON VIEW attorney_latest_final_cases IS 'Shows only the latest released/closed case per revision chain. Attorneys should query this view or use attorney_accessible_cases() function.';
COMMENT ON FUNCTION attorney_accessible_cases() IS 'Returns latest released/closed cases for the authenticated attorney. Only accessible to attorney role.';
