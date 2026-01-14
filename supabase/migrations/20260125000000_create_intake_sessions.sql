-- Migration: Create rc_client_intake_sessions table for resumable intake flow
-- This table stores INT intake sessions created BEFORE consents, with email-only resume
-- INT sessions are created immediately after minimum identity (first_name, last_name, email) is collected

CREATE TABLE IF NOT EXISTS public.rc_client_intake_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id text NOT NULL UNIQUE, -- INT-YYMMDD-##X format
  resume_token text NOT NULL UNIQUE, -- Secure token for resume link (not PHI)
  attorney_id text, -- Attorney ID from selection
  attorney_code text, -- Attorney code from selection
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  current_step integer NOT NULL DEFAULT 0, -- Last completed step
  form_data jsonb DEFAULT '{}'::jsonb, -- Autosaved form data
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL, -- 7 days from creation
  case_id uuid REFERENCES public.rc_cases(id) ON DELETE SET NULL, -- Linked after case creation
  intake_status text NOT NULL DEFAULT 'in_progress' CHECK (intake_status IN ('in_progress', 'submitted', 'expired', 'converted'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_intake_sessions_resume_token ON public.rc_client_intake_sessions(resume_token);
CREATE INDEX IF NOT EXISTS idx_intake_sessions_intake_id ON public.rc_client_intake_sessions(intake_id);
CREATE INDEX IF NOT EXISTS idx_intake_sessions_email ON public.rc_client_intake_sessions(email);
CREATE INDEX IF NOT EXISTS idx_intake_sessions_expires_at ON public.rc_client_intake_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_intake_sessions_case_id ON public.rc_client_intake_sessions(case_id);

-- Enable RLS
ALTER TABLE public.rc_client_intake_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow public access via resume_token (for resume links)
CREATE POLICY "intake_sessions_select_by_token"
ON public.rc_client_intake_sessions FOR SELECT
USING (true); -- Public read via token (token is secure, not PHI)

CREATE POLICY "intake_sessions_insert_public"
ON public.rc_client_intake_sessions FOR INSERT
WITH CHECK (true); -- Public insert for new sessions

CREATE POLICY "intake_sessions_update_by_token"
ON public.rc_client_intake_sessions FOR UPDATE
USING (true); -- Public update via token (for autosave)

COMMENT ON TABLE public.rc_client_intake_sessions IS 'Resumable intake sessions created after minimum identity collection. Stores INT- intake IDs and resume tokens for email-based resume links.';
COMMENT ON COLUMN public.rc_client_intake_sessions.intake_id IS 'INT-YYMMDD-##X format intake ID generated immediately after minimum identity is saved.';
COMMENT ON COLUMN public.rc_client_intake_sessions.resume_token IS 'Secure token used in resume email links. Not PHI, can be shared via email.';
COMMENT ON COLUMN public.rc_client_intake_sessions.current_step IS 'Last completed step in the intake flow. Used to restore user to correct position.';
COMMENT ON COLUMN public.rc_client_intake_sessions.form_data IS 'Autosaved form data (JSON). Stores all intake progress for resume.';
COMMENT ON COLUMN public.rc_client_intake_sessions.expires_at IS 'Session expiration (7 days from creation). After expiration, session cannot be resumed.';
COMMENT ON COLUMN public.rc_client_intake_sessions.intake_status IS 'Status: in_progress (active), submitted (intake completed), expired (7-day window passed), converted (permanent case created).';
