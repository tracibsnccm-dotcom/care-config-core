-- Migration: Add 'revised', 'working', and 'ready' statuses to rc_cases constraint
-- These statuses are used in the RN workflow state machine

DO $$
BEGIN
  -- Check if constraint exists and update it to include 'revised', 'working', and 'ready'
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rc_cases_case_status_check'
  ) THEN
    -- Drop existing constraint
    ALTER TABLE public.rc_cases DROP CONSTRAINT rc_cases_case_status_check;
  END IF;

  -- Add updated constraint with all RN workflow statuses
  ALTER TABLE public.rc_cases
  ADD CONSTRAINT rc_cases_case_status_check
  CHECK (
    case_status IS NULL 
    OR case_status IN ('draft', 'working', 'revised', 'ready', 'released', 'closed', 'open', 'hold')
  );
END $$;

COMMENT ON CONSTRAINT rc_cases_case_status_check ON public.rc_cases IS 
  'RN workflow statuses: draft/working/revised/ready (editable), ready (releasable), released/closed (immutable). Legacy: open/hold.';
