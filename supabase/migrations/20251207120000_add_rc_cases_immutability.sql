-- Migration: Enforce immutability for released/closed rc_cases revisions
-- Prevents UPDATE operations on released snapshots at the database level
-- UI already blocks edits; this prevents bypassing via direct DB access

-- ===========================
-- Step 1: Create trigger function to block updates on immutable rows
-- ===========================

CREATE OR REPLACE FUNCTION public.block_updates_on_released_cases()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_allowed_field_changes boolean := false;
BEGIN
  -- Check if the old row is immutable (released or closed)
  -- Immutable definition: released_at IS NOT NULL OR case_status IN ('released','closed')
  IF OLD.released_at IS NOT NULL OR OLD.case_status IN ('released', 'closed') THEN
    -- Allow narrow exception: transitioning from 'released' to 'closed'
    -- Only allow updates to case_status (to 'closed') and closed_at fields
    IF OLD.case_status = 'released' AND NEW.case_status = 'closed' THEN
      -- Check that only case_status and closed_at are changing
      -- Compare critical immutable fields to ensure they haven't changed
      v_allowed_field_changes := (
        -- Core immutable fields must not change
        (OLD.id = NEW.id)
        AND (OLD.revision_of_case_id IS NOT DISTINCT FROM NEW.revision_of_case_id)
        AND (OLD.released_at IS NOT DISTINCT FROM NEW.released_at)
        AND (OLD.released_by_rn_id IS NOT DISTINCT FROM NEW.released_by_rn_id)
        -- RN-authored content must not change
        AND (OLD.fourps IS NOT DISTINCT FROM NEW.fourps)
        AND (OLD.incident IS NOT DISTINCT FROM NEW.incident)
        AND (OLD.sdoh IS NOT DISTINCT FROM NEW.sdoh)
        -- Metadata fields should not change (but less critical)
        AND (OLD.case_type IS NOT DISTINCT FROM NEW.case_type)
        AND (OLD.date_of_injury IS NOT DISTINCT FROM NEW.date_of_injury)
        AND (OLD.jurisdiction IS NOT DISTINCT FROM NEW.jurisdiction)
        AND (OLD.client_id IS NOT DISTINCT FROM NEW.client_id)
        AND (OLD.attorney_id IS NOT DISTINCT FROM NEW.attorney_id)
        AND (OLD.rn_cm_id IS NOT DISTINCT FROM NEW.rn_cm_id)
        -- closed_at and case_status are allowed to change (already checked above)
      );
      
      IF v_allowed_field_changes THEN
        -- Allow this transition: released -> closed
        -- closed_at can be set or updated (if it wasn't set before)
        RETURN NEW;
      END IF;
    END IF;
    
    -- Block all other updates to released/closed cases
    RAISE EXCEPTION 'Cannot update released/closed case revisions. Released cases are immutable snapshots. Only allowed transition is released -> closed with closed_at set.';
  END IF;

  -- Allow all updates to draft/working/revised cases (not released/closed)
  RETURN NEW;
END;
$$;

-- ===========================
-- Step 2: Create trigger
-- ===========================

DROP TRIGGER IF EXISTS rc_cases_block_released_updates ON public.rc_cases;

CREATE TRIGGER rc_cases_block_released_updates
  BEFORE UPDATE ON public.rc_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.block_updates_on_released_cases();

-- ===========================
-- Step 3: Add consistency CHECK constraints (if safe)
-- ===========================

-- Check: If case_status = 'released', require released_at IS NOT NULL
-- Use NOT VALID initially to avoid breaking existing rows, then validate
DO $$
BEGIN
  -- Only add constraint if it doesn't exist and won't break existing data
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rc_cases_released_must_have_timestamp'
  ) THEN
    -- First check if there are any rows that would violate this
    IF NOT EXISTS (
      SELECT 1 FROM public.rc_cases 
      WHERE case_status = 'released' AND released_at IS NULL
    ) THEN
      ALTER TABLE public.rc_cases
      ADD CONSTRAINT rc_cases_released_must_have_timestamp
      CHECK (
        case_status != 'released' OR released_at IS NOT NULL
      );
    END IF;
  END IF;
END $$;

-- Check: If released_at IS NOT NULL, require case_status IN ('released','closed')
-- Use NOT VALID initially to avoid breaking existing rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rc_cases_released_timestamp_implies_status'
  ) THEN
    -- First check if there are any rows that would violate this
    IF NOT EXISTS (
      SELECT 1 FROM public.rc_cases 
      WHERE released_at IS NOT NULL 
        AND case_status NOT IN ('released', 'closed')
        AND case_status IS NOT NULL
    ) THEN
      ALTER TABLE public.rc_cases
      ADD CONSTRAINT rc_cases_released_timestamp_implies_status
      CHECK (
        released_at IS NULL OR case_status IN ('released', 'closed')
      );
    END IF;
  END IF;
END $$;

-- ===========================
-- Comments
-- ===========================

COMMENT ON FUNCTION public.block_updates_on_released_cases() IS 'Blocks UPDATE operations on released/closed case revisions. Allows narrow exception for transitioning released -> closed with closed_at set.';
COMMENT ON TRIGGER rc_cases_block_released_updates ON public.rc_cases IS 'Prevents updates to immutable released/closed case snapshots at the database level.';
