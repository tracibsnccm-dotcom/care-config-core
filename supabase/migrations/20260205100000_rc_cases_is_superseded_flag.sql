-- Migration: Add is_superseded flag to rc_cases for safe retirement of old/test rows (no deletes).
-- Superseded rows are excluded from default app queries; reversible and audit-safe.

ALTER TABLE public.rc_cases
  ADD COLUMN IF NOT EXISTS is_superseded boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.rc_cases.is_superseded IS 'When true, row is retired from normal UI; kept for audit. Exclude via is_superseded=eq.false by default.';

CREATE INDEX IF NOT EXISTS rc_cases_not_superseded_idx
  ON public.rc_cases (is_superseded, updated_at DESC NULLS LAST);

COMMENT ON INDEX public.rc_cases_not_superseded_idx IS 'Supports default filtering is_superseded=false and ordering by updated_at.';
