-- Create RN metadata table
CREATE TABLE IF NOT EXISTS public.rn_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  credentials TEXT,
  license_number TEXT,
  license_state TEXT,
  phone TEXT,
  alternate_phone TEXT,
  office_location TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  available_for_new_cases BOOLEAN DEFAULT true,
  max_active_cases INTEGER DEFAULT 20,
  preferred_shift TEXT DEFAULT 'day',
  weekend_availability BOOLEAN DEFAULT false,
  after_hours_availability BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rn_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rn_metadata
CREATE POLICY "RN can view own metadata"
  ON public.rn_metadata
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "RN can update own metadata"
  ON public.rn_metadata
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "RN can insert own metadata"
  ON public.rn_metadata
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Staff and admins can view all RN metadata
CREATE POLICY "Staff can view all RN metadata"
  ON public.rn_metadata
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'STAFF'::app_role) OR
    public.has_role(auth.uid(), 'SUPER_USER'::app_role) OR
    public.has_role(auth.uid(), 'SUPER_ADMIN'::app_role)
  );

-- Add updated_at trigger
CREATE TRIGGER update_rn_metadata_updated_at
  BEFORE UPDATE ON public.rn_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Extend user_preferences table with RN-specific columns
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sms_notifications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS urgent_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS case_updates BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS client_messages BOOLEAN DEFAULT true;