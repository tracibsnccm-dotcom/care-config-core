-- Migration: Add unique constraint on rc_cases.client_pin to prevent duplicate PINs.
-- Supports idempotent attorney confirmation: re-attest must not create a new PIN.
-- Only enforces uniqueness for non-null client_pin (allows many NULLs before confirmation).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rc_cases' AND column_name = 'client_pin'
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rc_cases_client_pin_unique
      ON public.rc_cases (client_pin) WHERE client_pin IS NOT NULL;
    RAISE NOTICE 'Created unique index idx_rc_cases_client_pin_unique on rc_cases(client_pin) WHERE client_pin IS NOT NULL';
  ELSE
    RAISE NOTICE 'Skipping: rc_cases.client_pin column does not exist';
  END IF;
END $$;
