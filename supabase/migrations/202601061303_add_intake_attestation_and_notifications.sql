-- Migration: Add intake submission, attorney attestation, deadline tracking, deletion workflow, and notification dedupe/audit
-- This migration adds support for:
-- 1. Tracking intake submission and attorney attestation timestamps
-- 2. Attorney confirmation deadline tracking (48h window)
-- 3. Intake status workflow (draft -> submitted_pending_attorney -> attorney_confirmed -> expired_deleted)
-- 4. Notification deduplication and audit logging
-- 5. Tombstone records for non-PHI audit after deletion

-- ===========================
-- Step 1: Ensure rc_client_intakes table exists (create if not)
-- ===========================

CREATE TABLE IF NOT EXISTS public.rc_client_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.rc_cases(id) ON DELETE CASCADE,
  intake_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ===========================
-- Step 2: Add intake attestation and status tracking columns to rc_client_intakes
-- ===========================

-- Add intake submission timestamp
ALTER TABLE public.rc_client_intakes
  ADD COLUMN IF NOT EXISTS intake_submitted_at timestamptz;

-- Add attorney confirmation deadline (calculated as submitted_at + 48h)
ALTER TABLE public.rc_client_intakes
  ADD COLUMN IF NOT EXISTS attorney_confirm_deadline_at timestamptz;

-- Add attorney attestation timestamp
ALTER TABLE public.rc_client_intakes
  ADD COLUMN IF NOT EXISTS attorney_attested_at timestamptz;

-- Add attorney ID who attested (text for now, can be uuid later if attorney auth is wired)
ALTER TABLE public.rc_client_intakes
  ADD COLUMN IF NOT EXISTS attorney_attested_by text;

-- Add intake status with default 'draft'
ALTER TABLE public.rc_client_intakes
  ADD COLUMN IF NOT EXISTS intake_status text NOT NULL DEFAULT 'draft';

-- Add deletion tracking
ALTER TABLE public.rc_client_intakes
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Add deletion reason
ALTER TABLE public.rc_client_intakes
  ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Add last notification timestamp for reminder tracking
ALTER TABLE public.rc_client_intakes
  ADD COLUMN IF NOT EXISTS last_notified_at timestamptz;

-- Add check constraint for intake_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rc_client_intakes_intake_status_check'
  ) THEN
    ALTER TABLE public.rc_client_intakes
      ADD CONSTRAINT rc_client_intakes_intake_status_check
      CHECK (intake_status IN ('draft', 'submitted_pending_attorney', 'attorney_confirmed', 'expired_deleted'));
  END IF;
END $$;

-- ===========================
-- Step 3: Create notification log table for deduplication and audit
-- ===========================

CREATE TABLE IF NOT EXISTS public.rc_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.rc_cases(id) ON DELETE SET NULL,
  intake_id uuid REFERENCES public.rc_client_intakes(id) ON DELETE SET NULL,
  attorney_id text,
  client_id uuid REFERENCES public.rc_clients(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'inapp')),
  template_key text NOT NULL,  -- e.g. 'attorney_24h', 'attorney_8h', 'attorney_expired', 'client_24h', etc.
  sent_at timestamptz NOT NULL DEFAULT now(),
  dedupe_key text NOT NULL UNIQUE  -- Composite key to prevent duplicate sends
);

-- ===========================
-- Step 4: Create tombstone table for non-PHI audit after deletion
-- ===========================

CREATE TABLE IF NOT EXISTS public.rc_intake_tombstones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid NOT NULL,  -- Reference to original intake (may not have FK if intake is deleted)
  case_id uuid REFERENCES public.rc_cases(id) ON DELETE SET NULL,
  attorney_id text,
  client_id uuid REFERENCES public.rc_clients(id) ON DELETE SET NULL,
  intake_submitted_at timestamptz,
  attorney_confirm_deadline_at timestamptz,
  attorney_attested_at timestamptz,
  deleted_at timestamptz NOT NULL DEFAULT now(),
  reason text NOT NULL
);

-- ===========================
-- Step 5: Add helpful indexes for performance
-- ===========================

-- Index on intake_status for filtering by status
CREATE INDEX IF NOT EXISTS idx_rc_client_intakes_intake_status 
  ON public.rc_client_intakes(intake_status);

-- Index on attorney_confirm_deadline_at for deadline queries
CREATE INDEX IF NOT EXISTS idx_rc_client_intakes_attorney_confirm_deadline 
  ON public.rc_client_intakes(attorney_confirm_deadline_at);

-- Index on case_id for joins (if not already exists)
CREATE INDEX IF NOT EXISTS idx_rc_client_intakes_case_id 
  ON public.rc_client_intakes(case_id);

-- Index on notification log template_key for filtering by notification type
CREATE INDEX IF NOT EXISTS idx_rc_notification_log_template_key 
  ON public.rc_notification_log(template_key);

-- Index on notification log attorney_id for attorney-specific queries
CREATE INDEX IF NOT EXISTS idx_rc_notification_log_attorney_id 
  ON public.rc_notification_log(attorney_id);

-- Index on notification log intake_id for intake-specific queries
CREATE INDEX IF NOT EXISTS idx_rc_notification_log_intake_id 
  ON public.rc_notification_log(intake_id);

-- Index on notification log sent_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_rc_notification_log_sent_at 
  ON public.rc_notification_log(sent_at DESC);

-- Index on tombstone deleted_at for audit queries
CREATE INDEX IF NOT EXISTS idx_rc_intake_tombstones_deleted_at 
  ON public.rc_intake_tombstones(deleted_at DESC);

-- Index on tombstone intake_id for lookups
CREATE INDEX IF NOT EXISTS idx_rc_intake_tombstones_intake_id 
  ON public.rc_intake_tombstones(intake_id);

-- ===========================
-- Step 6: Add comments for documentation
-- ===========================

COMMENT ON TABLE public.rc_client_intakes IS 'Client intake submissions with attorney attestation and deadline tracking. Tracks intake status workflow from draft through submission, attorney confirmation, or expiration.';
COMMENT ON COLUMN public.rc_client_intakes.intake_submitted_at IS 'Timestamp when client submitted the intake form. Used to calculate attorney_confirm_deadline_at (submitted_at + 48h).';
COMMENT ON COLUMN public.rc_client_intakes.attorney_confirm_deadline_at IS 'Deadline timestamp for attorney confirmation (calculated as intake_submitted_at + 48 hours). If this passes without attorney_attested_at, intake expires.';
COMMENT ON COLUMN public.rc_client_intakes.attorney_attested_at IS 'Timestamp when attorney confirmed/attested the intake. Must occur before attorney_confirm_deadline_at.';
COMMENT ON COLUMN public.rc_client_intakes.attorney_attested_by IS 'ID of attorney who attested (text for now; can be uuid/rc_users.id reference when attorney auth is fully wired).';
COMMENT ON COLUMN public.rc_client_intakes.intake_status IS 'Status of intake: draft, submitted_pending_attorney, attorney_confirmed, or expired_deleted.';
COMMENT ON COLUMN public.rc_client_intakes.deleted_at IS 'Timestamp when intake data was deleted (soft delete for PHI removal).';
COMMENT ON COLUMN public.rc_client_intakes.deletion_reason IS 'Reason for deletion (e.g., "attorney_48h_window_expired", "manual_deletion").';
COMMENT ON COLUMN public.rc_client_intakes.last_notified_at IS 'Last notification timestamp for reminder tracking and deduplication.';

COMMENT ON TABLE public.rc_notification_log IS 'Audit log for all notifications sent (email, SMS, in-app). Includes dedupe_key to prevent duplicate sends. Tracks reminder schedules (24h, 8h, 4h, 1h remaining, on submit, expired).';
COMMENT ON COLUMN public.rc_notification_log.dedupe_key IS 'Unique composite key (e.g., intake_id:template_key:channel) to prevent duplicate notification sends. Must be unique across all notifications.';
COMMENT ON COLUMN public.rc_notification_log.template_key IS 'Template identifier: attorney_24h, attorney_8h, attorney_4h, attorney_1h, attorney_on_submit, attorney_expired, client_24h, etc.';

COMMENT ON TABLE public.rc_intake_tombstones IS 'Non-PHI audit record preserved after intake deletion. Stores case_id, attorney_id, timestamps, and deletion reason. Used for compliance and audit trails without retaining PHI.';
COMMENT ON COLUMN public.rc_intake_tombstones.intake_id IS 'Reference to original intake ID (FK may not exist if intake was fully deleted).';
COMMENT ON COLUMN public.rc_intake_tombstones.reason IS 'Reason for deletion (required): e.g., "attorney_48h_window_expired", "manual_deletion_by_attorney".';
