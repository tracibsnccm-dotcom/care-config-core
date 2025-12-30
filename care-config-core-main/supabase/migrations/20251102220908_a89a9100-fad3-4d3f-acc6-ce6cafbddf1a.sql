-- Create dedicated table for sensitive personal disclosures with tight access control
CREATE TABLE IF NOT EXISTS public.client_sensitive_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  
  -- What the client selected
  category TEXT NOT NULL CHECK (category IN ('substance_use', 'safety_trauma', 'stressors')),
  item_code TEXT NOT NULL,
  selected BOOLEAN NOT NULL DEFAULT true,
  free_text TEXT,
  
  -- Risk + origin
  risk_level TEXT CHECK (risk_level IN ('RED', 'ORANGE', 'YELLOW')),
  origin_section TEXT NOT NULL DEFAULT 'sensitive_section' CHECK (origin_section IN ('sensitive_section', 'bh_screen')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Consent per destination (3-state)
  consent_attorney TEXT CHECK (consent_attorney IN ('share', 'no_share', 'unset')) DEFAULT 'unset',
  consent_provider TEXT CHECK (consent_provider IN ('share', 'no_share', 'unset')) DEFAULT 'unset',
  consent_ts TIMESTAMPTZ,
  
  -- Audit
  audit_event TEXT CHECK (audit_event IN ('added', 'updated', 'discarded', 'skipped_section')),
  audit_note TEXT
);

-- Add lightweight indicator to cases
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS has_sensitive_disclosures BOOLEAN DEFAULT FALSE;

-- Create audit events table for tracking
CREATE TABLE IF NOT EXISTS public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sensitive_disclosures_case ON public.client_sensitive_disclosures(case_id);
CREATE INDEX IF NOT EXISTS idx_sensitive_disclosures_risk ON public.client_sensitive_disclosures(risk_level) WHERE risk_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_events_case ON public.audit_events(case_id);

-- Enable RLS
ALTER TABLE public.client_sensitive_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_sensitive_disclosures (tight PHI control)
CREATE POLICY "Clients can insert their own disclosures"
  ON public.client_sensitive_disclosures FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM case_assignments ca WHERE ca.case_id = client_sensitive_disclosures.case_id AND ca.user_id = auth.uid())
  );

CREATE POLICY "Clients can view their own disclosures"
  ON public.client_sensitive_disclosures FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    has_role('RN_CCM') OR 
    has_role('STAFF') OR 
    has_role('SUPER_USER') OR 
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "Clients and RN can update disclosures"
  ON public.client_sensitive_disclosures FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    has_role('RN_CCM') OR 
    has_role('STAFF') OR 
    has_role('SUPER_USER') OR 
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "RN and staff can delete disclosures"
  ON public.client_sensitive_disclosures FOR DELETE
  TO authenticated
  USING (
    has_role('RN_CCM') OR 
    has_role('STAFF') OR 
    has_role('SUPER_USER') OR 
    has_role('SUPER_ADMIN')
  );

-- RLS Policies for audit_events
CREATE POLICY "Users can insert audit events for their cases"
  ON public.audit_events FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM case_assignments ca WHERE ca.case_id = audit_events.case_id AND ca.user_id = auth.uid())
  );

CREATE POLICY "Users can view audit events for their cases"
  ON public.audit_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM case_assignments ca WHERE ca.case_id = audit_events.case_id AND ca.user_id = auth.uid()) OR
    has_role('STAFF') OR 
    has_role('SUPER_USER') OR 
    has_role('SUPER_ADMIN')
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_sensitive_disclosures_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sensitive_disclosures_updated_at
  BEFORE UPDATE ON public.client_sensitive_disclosures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sensitive_disclosures_updated_at();