-- Migration: Enforce one rc_cases row per intake — UNIQUE on original_int_number, mark duplicates as superseded
-- Prevents duplicate case creation (e.g. double-submit in IntakeWizard or any path that INSERTs rc_cases).
-- Canonical intake key: original_int_number (INT-YYMMDD-##X from rc_client_intake_sessions.intake_id).

-- ===========================
-- Step 1: Add original_int_number to rc_cases (canonical intake key)
-- ===========================
ALTER TABLE public.rc_cases
  ADD COLUMN IF NOT EXISTS original_int_number text;

COMMENT ON COLUMN public.rc_cases.original_int_number IS 'INT-YYMMDD-##X from rc_client_intake_sessions.intake_id. Canonical key: one intake = one rc_cases. UNIQUE when not null.';

-- ===========================
-- Step 2: Backfill from rc_client_intake_sessions
-- ===========================
UPDATE public.rc_cases c
SET original_int_number = s.intake_id
FROM public.rc_client_intake_sessions s
WHERE s.case_id = c.id
  AND s.intake_id IS NOT NULL
  AND (c.original_int_number IS NULL OR c.original_int_number <> s.intake_id);

-- ===========================
-- Step 3: Add superseded_by_case_id to mark duplicate rows (do NOT delete)
-- ===========================
ALTER TABLE public.rc_cases
  ADD COLUMN IF NOT EXISTS superseded_by_case_id uuid REFERENCES public.rc_cases(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.rc_cases.superseded_by_case_id IS 'If set, this row is a duplicate; the authoritative case is superseded_by_case_id. Do not use for queries.';

-- ===========================
-- Step 4: Cleanup — mark older duplicates as superseded
-- For each original_int_number with multiple rc_cases, keep one and point others to it.
-- Canonical = referenced by rc_client_intake_sessions.case_id, else by rc_client_intakes.case_id, else earliest created.
-- ===========================
DO $$
DECLARE
  r RECORD;
  keep_id uuid;
  dup_id uuid;
BEGIN
  FOR r IN
    SELECT orig.original_int_number, array_agg(orig.id ORDER BY orig.created_at ASC) AS ids
    FROM public.rc_cases orig
    WHERE orig.original_int_number IS NOT NULL
      AND orig.superseded_by_case_id IS NULL
    GROUP BY orig.original_int_number
    HAVING count(*) > 1
  LOOP
    -- Prefer: session.case_id > rc_client_intakes.case_id (submitted/confirmed) > earliest
    SELECT COALESCE(
      (SELECT s.case_id FROM public.rc_client_intake_sessions s WHERE s.case_id = ANY(r.ids) LIMIT 1),
      (SELECT i.case_id FROM public.rc_client_intakes i WHERE i.case_id = ANY(r.ids) AND i.intake_status IN ('submitted_pending_attorney', 'attorney_confirmed') LIMIT 1),
      r.ids[1]
    ) INTO keep_id;

    FOREACH dup_id IN ARRAY r.ids
    LOOP
      IF dup_id IS DISTINCT FROM keep_id THEN
        UPDATE public.rc_cases SET superseded_by_case_id = keep_id WHERE id = dup_id AND superseded_by_case_id IS NULL;
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- Repoint rc_client_intakes and rc_client_intake_sessions from superseded cases to the canonical
UPDATE public.rc_client_intakes i
SET case_id = r.superseded_by_case_id
FROM public.rc_cases r
WHERE i.case_id = r.id AND r.superseded_by_case_id IS NOT NULL;

UPDATE public.rc_client_intake_sessions s
SET case_id = r.superseded_by_case_id
FROM public.rc_cases r
WHERE s.case_id = r.id AND r.superseded_by_case_id IS NOT NULL;

-- ===========================
-- Step 5: UNIQUE constraint on original_int_number (partial: non-null and not superseded)
-- Superseded rows keep original_int_number for audit but are excluded from uniqueness.
-- ===========================
CREATE UNIQUE INDEX IF NOT EXISTS idx_rc_cases_original_int_number_unique
  ON public.rc_cases (original_int_number)
  WHERE original_int_number IS NOT NULL AND superseded_by_case_id IS NULL;

COMMENT ON INDEX public.idx_rc_cases_original_int_number_unique IS 'One rc_cases per intake. Prevents duplicate case creation at DB level. Superseded rows excluded.';
