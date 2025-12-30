-- Create client_preferences table for consent tracking
CREATE TABLE IF NOT EXISTS public.client_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attorney_notify_consent BOOLEAN NOT NULL DEFAULT false,
  consent_signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  consent_expires_at TIMESTAMPTZ,
  revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE public.client_preferences ENABLE ROW LEVEL SECURITY;

-- Clients can view their own preferences
CREATE POLICY "Clients can view own preferences"
ON public.client_preferences
FOR SELECT
USING (auth.uid() = client_id);

-- Clients can insert their own preferences
CREATE POLICY "Clients can insert own preferences"
ON public.client_preferences
FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Clients can update their own preferences
CREATE POLICY "Clients can update own preferences"
ON public.client_preferences
FOR UPDATE
USING (auth.uid() = client_id);

-- RN, Staff, and Admins can view all preferences
CREATE POLICY "Staff can view preferences"
ON public.client_preferences
FOR SELECT
USING (
  has_role('RN_CCM') OR 
  has_role('ATTORNEY') OR 
  has_role('STAFF') OR 
  has_role('SUPER_USER') OR 
  has_role('SUPER_ADMIN')
);

-- Add disclosure_scope to case_alerts if it doesn't exist
DO $$ 
BEGIN
  -- Create enum for disclosure scope if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'disclosure_scope') THEN
    CREATE TYPE public.disclosure_scope AS ENUM ('internal', 'minimal', 'full');
  END IF;
END $$;

-- Create case_alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.case_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  message TEXT NOT NULL,
  disclosure_scope public.disclosure_scope NOT NULL DEFAULT 'internal',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on case_alerts
ALTER TABLE public.case_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view alerts for their cases
CREATE POLICY "Users can view alerts for their cases"
ON public.case_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = case_alerts.case_id
    AND ca.user_id = auth.uid()
  ) OR 
  has_role('SUPER_USER') OR 
  has_role('SUPER_ADMIN')
);

-- RN and staff can create alerts
CREATE POLICY "RN and staff can create alerts"
ON public.case_alerts
FOR INSERT
WITH CHECK (
  has_role('RN_CCM') OR 
  has_role('ATTORNEY') OR 
  has_role('STAFF') OR 
  has_role('SUPER_USER') OR 
  has_role('SUPER_ADMIN')
);

-- Staff can update alerts (acknowledge them)
CREATE POLICY "Staff can update alerts"
ON public.case_alerts
FOR UPDATE
USING (
  has_role('RN_CCM') OR 
  has_role('ATTORNEY') OR 
  has_role('STAFF') OR 
  has_role('SUPER_USER') OR 
  has_role('SUPER_ADMIN')
);

-- Create disclosure_log table for audit trail
CREATE TABLE IF NOT EXISTS public.disclosure_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  alert_id UUID REFERENCES public.case_alerts(id) ON DELETE CASCADE,
  authorization_id UUID REFERENCES public.client_preferences(id),
  disclosed_to_user_id UUID NOT NULL REFERENCES auth.users(id),
  disclosed_to_role TEXT NOT NULL,
  disclosure_scope public.disclosure_scope NOT NULL,
  disclosure_reason TEXT NOT NULL,
  disclosed_by UUID REFERENCES auth.users(id),
  disclosed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on disclosure_log
ALTER TABLE public.disclosure_log ENABLE ROW LEVEL SECURITY;

-- Only admins and authorized staff can view disclosure logs
CREATE POLICY "Authorized staff can view disclosure logs"
ON public.disclosure_log
FOR SELECT
USING (
  has_role('RN_CCM') OR 
  has_role('ATTORNEY') OR 
  has_role('STAFF') OR 
  has_role('SUPER_USER') OR 
  has_role('SUPER_ADMIN')
);

-- RN and staff can create disclosure logs
CREATE POLICY "RN and staff can create disclosure logs"
ON public.disclosure_log
FOR INSERT
WITH CHECK (
  has_role('RN_CCM') OR 
  has_role('ATTORNEY') OR 
  has_role('STAFF') OR 
  has_role('SUPER_USER') OR 
  has_role('SUPER_ADMIN')
);

-- Add trigger for updated_at on client_preferences
CREATE OR REPLACE FUNCTION update_client_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_preferences_updated_at
BEFORE UPDATE ON public.client_preferences
FOR EACH ROW
EXECUTE FUNCTION update_client_preferences_updated_at();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_preferences_client_id ON public.client_preferences(client_id);
CREATE INDEX IF NOT EXISTS idx_case_alerts_case_id ON public.case_alerts(case_id);
CREATE INDEX IF NOT EXISTS idx_case_alerts_severity ON public.case_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_disclosure_log_case_id ON public.disclosure_log(case_id);
CREATE INDEX IF NOT EXISTS idx_disclosure_log_disclosed_to ON public.disclosure_log(disclosed_to_user_id);