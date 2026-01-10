-- Migration: Add attorney_code to rc_users and auto-assign codes
-- This migration adds support for:
-- 1. attorney_code field (2-digit code: '01', '02', etc.)
-- 2. Auto-assignment function for next available code
-- 3. Assign codes to existing attorneys
-- 4. Trigger to auto-assign codes to new attorney registrations

-- ===========================
-- Step 1: Add attorney_code column to rc_users
-- ===========================

ALTER TABLE public.rc_users
  ADD COLUMN IF NOT EXISTS attorney_code TEXT;

-- Add unique constraint (only for attorneys)
-- Note: NULL values are allowed and don't violate unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_rc_users_attorney_code_unique
  ON public.rc_users(attorney_code)
  WHERE attorney_code IS NOT NULL AND role = 'attorney';

-- Add check constraint to ensure attorney_code is 2 digits for attorneys
-- Note: PostgreSQL doesn't support "IF NOT EXISTS" for constraints, so we'll check first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rc_users_attorney_code_format_check'
  ) THEN
    ALTER TABLE public.rc_users
      ADD CONSTRAINT rc_users_attorney_code_format_check
      CHECK (
        (role = 'attorney' AND attorney_code IS NULL) OR
        (role = 'attorney' AND attorney_code ~ '^[0-9]{2}$') OR
        (role != 'attorney' AND attorney_code IS NULL)
      );
  END IF;
END;
$$;

-- ===========================
-- Step 2: Create function to assign next available attorney_code
-- ===========================

CREATE OR REPLACE FUNCTION public.assign_next_attorney_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_max_number INTEGER;
  v_next_number INTEGER;
  v_next_code TEXT;
BEGIN
  -- Use advisory lock to ensure atomic operation (prevent race conditions)
  -- Lock ID 12345 for attorney code assignment
  PERFORM pg_advisory_xact_lock(12345);
  
  -- Find the highest existing attorney_code among attorneys
  SELECT MAX(attorney_code::INTEGER)
  INTO v_max_number
  FROM public.rc_users
  WHERE role = 'attorney'
    AND attorney_code IS NOT NULL
    AND attorney_code ~ '^[0-9]{2}$';
  
  -- If no attorneys exist yet, start at 01
  IF v_max_number IS NULL THEN
    v_next_number := 1;
  ELSE
    v_next_number := v_max_number + 1;
  END IF;
  
  -- Check if we've exceeded max (99)
  IF v_next_number > 99 THEN
    RAISE EXCEPTION 'Maximum attorney codes (99) reached. Cannot assign new attorney code.';
  END IF;
  
  -- Format as 2-digit string (01, 02, etc.)
  v_next_code := LPAD(v_next_number::TEXT, 2, '0');
  
  -- Double-check that this code doesn't already exist (shouldn't happen, but safety check)
  IF EXISTS (
    SELECT 1 FROM public.rc_users 
    WHERE role = 'attorney' AND attorney_code = v_next_code
  ) THEN
    -- If somehow it exists, try to find next available
    SELECT COALESCE(MAX(attorney_code::INTEGER), 0) + 1
    INTO v_next_number
    FROM public.rc_users
    WHERE role = 'attorney'
      AND attorney_code IS NOT NULL
      AND attorney_code ~ '^[0-9]{2}$';
    
    IF v_next_number > 99 THEN
      RAISE EXCEPTION 'Maximum attorney codes (99) reached. Cannot assign new attorney code.';
    END IF;
    
    v_next_code := LPAD(v_next_number::TEXT, 2, '0');
  END IF;
  
  RETURN v_next_code;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.assign_next_attorney_code() IS 
  'Assigns the next available 2-digit attorney code (01-99) atomically. Uses advisory lock to prevent race conditions.';

-- ===========================
-- Step 3: Assign codes to existing attorneys
-- ===========================

DO $$
DECLARE
  v_attorney_record RECORD;
  v_attorney_code TEXT;
  v_counter INTEGER := 1;
BEGIN
  -- Loop through existing attorneys without codes, ordered by created_at
  FOR v_attorney_record IN
    SELECT id, auth_user_id, full_name, created_at
    FROM public.rc_users
    WHERE role = 'attorney'
      AND attorney_code IS NULL
    ORDER BY created_at ASC, id ASC
  LOOP
    -- Assign sequential code starting from 01
    v_attorney_code := LPAD(v_counter::TEXT, 2, '0');
    
    -- Check if this code already exists (shouldn't for new assignments, but safety check)
    WHILE EXISTS (
      SELECT 1 FROM public.rc_users 
      WHERE role = 'attorney' AND attorney_code = v_attorney_code
    ) LOOP
      v_counter := v_counter + 1;
      v_attorney_code := LPAD(v_counter::TEXT, 2, '0');
      
      -- Safety check for max
      IF v_counter > 99 THEN
        RAISE EXCEPTION 'Cannot assign attorney codes: maximum (99) would be exceeded.';
      END IF;
    END LOOP;
    
    -- Update attorney with assigned code
    UPDATE public.rc_users
    SET attorney_code = v_attorney_code
    WHERE id = v_attorney_record.id;
    
    -- Increment counter for next attorney
    v_counter := v_counter + 1;
    
    -- Safety check for max
    IF v_counter > 99 THEN
      RAISE EXCEPTION 'Cannot assign attorney codes: maximum (99) would be exceeded.';
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Assigned attorney codes to % existing attorneys', v_counter - 1;
END;
$$;

-- ===========================
-- Step 4: Create trigger function for auto-assigning codes to new attorneys
-- ===========================

CREATE OR REPLACE FUNCTION public.auto_assign_attorney_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only assign code if:
  -- 1. Role is 'attorney'
  -- 2. attorney_code is NULL (not already assigned)
  IF NEW.role = 'attorney' AND NEW.attorney_code IS NULL THEN
    NEW.attorney_code := assign_next_attorney_code();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.auto_assign_attorney_code() IS 
  'Trigger function that automatically assigns attorney_code to new attorney registrations.';

-- Create trigger (fires BEFORE INSERT to set value before row is created)
DROP TRIGGER IF EXISTS trigger_auto_assign_attorney_code ON public.rc_users;

CREATE TRIGGER trigger_auto_assign_attorney_code
  BEFORE INSERT ON public.rc_users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_assign_attorney_code();

-- ===========================
-- Step 5: Add helpful comments for documentation
-- ===========================

COMMENT ON COLUMN public.rc_users.attorney_code IS 
  '2-digit attorney code (01-99) assigned automatically on registration. Unique per attorney. Used for generating case numbers. Only populated for attorneys (role = ''attorney'').';
