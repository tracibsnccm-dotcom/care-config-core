-- Add contact information fields to rn_diary_entries
ALTER TABLE public.rn_diary_entries
ADD COLUMN contact_phone TEXT,
ADD COLUMN contact_email TEXT,
ADD COLUMN requires_contact BOOLEAN DEFAULT false;

-- Add constraint: if requires_contact is true, must have phone or email based on entry type
CREATE OR REPLACE FUNCTION validate_diary_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- Phone/text entries must have phone number
  IF NEW.entry_type IN ('phone_call', 'text_message', 'client_followup') AND NEW.requires_contact = true THEN
    IF NEW.contact_phone IS NULL OR NEW.contact_phone = '' THEN
      RAISE EXCEPTION 'Phone number is required for phone/text diary entries';
    END IF;
  END IF;
  
  -- Email entries must have email address
  IF NEW.entry_type = 'email' AND NEW.requires_contact = true THEN
    IF NEW.contact_email IS NULL OR NEW.contact_email = '' THEN
      RAISE EXCEPTION 'Email address is required for email diary entries';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_diary_contact_trigger
BEFORE INSERT OR UPDATE ON public.rn_diary_entries
FOR EACH ROW
EXECUTE FUNCTION validate_diary_contact();

-- Create table for tracking emergency triggers and SDOH alerts
CREATE TABLE IF NOT EXISTS public.rn_emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id),
  client_id UUID NOT NULL,
  rn_id UUID REFERENCES auth.users(id),
  alert_type TEXT NOT NULL, -- 'emergency_911', 'emergency_988', 'sdoh_trigger', 'critical_wellness'
  alert_details JSONB DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'high', -- 'critical', 'high', 'medium'
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.rn_emergency_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "RN can view alerts for their cases"
ON public.rn_emergency_alerts
FOR SELECT
USING (
  rn_id = auth.uid() OR
  has_role('RN_CCM_DIRECTOR') OR
  has_role('RN_CCM_SUPERVISOR') OR
  has_role('SUPER_USER') OR
  has_role('SUPER_ADMIN')
);

CREATE POLICY "RN can acknowledge their alerts"
ON public.rn_emergency_alerts
FOR UPDATE
USING (
  rn_id = auth.uid() OR
  has_role('RN_CCM_DIRECTOR') OR
  has_role('RN_CCM_SUPERVISOR') OR
  has_role('SUPER_USER') OR
  has_role('SUPER_ADMIN')
);

CREATE POLICY "System can create emergency alerts"
ON public.rn_emergency_alerts
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_rn_emergency_alerts_rn_id ON public.rn_emergency_alerts(rn_id);
CREATE INDEX idx_rn_emergency_alerts_acknowledged ON public.rn_emergency_alerts(acknowledged);
CREATE INDEX idx_rn_emergency_alerts_created_at ON public.rn_emergency_alerts(created_at DESC);