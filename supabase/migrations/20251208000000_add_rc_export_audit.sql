-- Migration: Add audit trail table for attorney exports of released RN case snapshots
-- This table tracks when attorneys export (print/download) released or closed case snapshots

-- ===========================
-- Step 1: Create rc_export_audit table
-- ===========================

CREATE TABLE IF NOT EXISTS public.rc_export_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  attorney_user_id uuid NOT NULL,  -- auth.uid() of attorney user (set automatically via trigger if not provided)
  attorney_id uuid,                -- optional if we have rc_users row
  client_id uuid,
  revision_chain_root_case_id uuid NOT NULL,  -- the chain root (revision_of_case_id root or selected chain id)
  released_case_id uuid NOT NULL,  -- the specific released/closed snapshot exported
  export_action text NOT NULL CHECK (export_action IN ('PRINT_PDF', 'DOWNLOAD_TEXT')),
  export_format text NOT NULL CHECK (export_format IN ('PDF', 'TEXT')),
  export_label text NOT NULL DEFAULT 'Export Released RN Case Snapshot',
  file_name text,
  user_agent text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- ===========================
-- Step 2: Add indexes for performance
-- ===========================

CREATE INDEX IF NOT EXISTS idx_rc_export_audit_created_at ON public.rc_export_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rc_export_audit_attorney_user_created ON public.rc_export_audit(attorney_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rc_export_audit_released_case_id ON public.rc_export_audit(released_case_id);
CREATE INDEX IF NOT EXISTS idx_rc_export_audit_revision_chain_root ON public.rc_export_audit(revision_chain_root_case_id);

-- ===========================
-- Step 3: Create trigger function to set attorney_user_id from auth.uid()
-- ===========================

-- Function to automatically set attorney_user_id from auth.uid() if not provided
CREATE OR REPLACE FUNCTION public.set_attorney_user_id_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always set attorney_user_id from auth.uid() (enforces that it matches the authenticated user)
  NEW.attorney_user_id := auth.uid();
  RETURN NEW;
END;
$$;

-- Create trigger to automatically set attorney_user_id before insert
DROP TRIGGER IF EXISTS set_attorney_user_id_trigger ON public.rc_export_audit;
CREATE TRIGGER set_attorney_user_id_trigger
  BEFORE INSERT ON public.rc_export_audit
  FOR EACH ROW
  EXECUTE FUNCTION public.set_attorney_user_id_from_auth();

-- ===========================
-- Step 4: Create SECURITY DEFINER function to validate released case status
-- ===========================

CREATE OR REPLACE FUNCTION public.validate_released_case_for_export(case_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the case exists and has status 'released' or 'closed'
  RETURN EXISTS (
    SELECT 1
    FROM rc_cases
    WHERE id = case_id_param
      AND case_status IN ('released', 'closed')
  );
END;
$$;

-- ===========================
-- Step 5: Enable Row Level Security
-- ===========================

ALTER TABLE public.rc_export_audit ENABLE ROW LEVEL SECURITY;

-- ===========================
-- Step 6: Create RLS policies
-- ===========================

-- INSERT policy: Only authenticated users can insert, and ONLY if export is for a released/closed case snapshot.
-- Enforce that released_case_id exists in rc_cases AND case_status in ('released','closed').
-- Also require attorney_user_id = auth.uid().
CREATE POLICY "rc_export_audit_insert_released_only"
ON public.rc_export_audit
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND attorney_user_id = auth.uid()
  AND public.validate_released_case_for_export(released_case_id) = true
);

-- SELECT policy: Attorney can read ONLY their own audit rows (attorney_user_id = auth.uid()).
CREATE POLICY "rc_export_audit_select_own"
ON public.rc_export_audit
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND attorney_user_id = auth.uid()
);

-- No UPDATE/DELETE policies - deny by default (RLS blocks all operations not explicitly allowed)

-- ===========================
-- Step 7: Add comments for documentation
-- ===========================

COMMENT ON TABLE public.rc_export_audit IS 'Audit trail for attorney exports of released/closed RN case snapshots. Tracks when attorneys print or download case data.';
COMMENT ON COLUMN public.rc_export_audit.attorney_user_id IS 'Auth user ID (auth.uid()) of the attorney performing the export. Automatically set from auth.uid() via trigger if not provided. Must match auth.uid() for INSERT.';
COMMENT ON FUNCTION public.set_attorney_user_id_from_auth() IS 'Trigger function that automatically sets attorney_user_id to auth.uid() if not provided in the insert payload.';
COMMENT ON COLUMN public.rc_export_audit.attorney_id IS 'Optional reference to rc_users.id if attorney has a row in rc_users table.';
COMMENT ON COLUMN public.rc_export_audit.revision_chain_root_case_id IS 'The root case ID in the revision chain (found via get_case_root_id() or selected chain id).';
COMMENT ON COLUMN public.rc_export_audit.released_case_id IS 'The specific released/closed case snapshot being exported. Must exist in rc_cases with case_status in (''released'', ''closed'').';
COMMENT ON COLUMN public.rc_export_audit.export_action IS 'Action type: PRINT_PDF or DOWNLOAD_TEXT';
COMMENT ON COLUMN public.rc_export_audit.export_format IS 'Format of export: PDF or TEXT';
COMMENT ON FUNCTION public.validate_released_case_for_export(uuid) IS 'Validates that a case ID exists in rc_cases and has status ''released'' or ''closed''. Used in RLS INSERT policy.';
