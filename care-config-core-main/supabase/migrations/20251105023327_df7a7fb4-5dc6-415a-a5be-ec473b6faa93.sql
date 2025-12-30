-- Add missing columns to existing providers table
ALTER TABLE public.providers 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS staff_text_number TEXT,
  ADD COLUMN IF NOT EXISTS staff_name TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip_code TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Make NPI unique if not already
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'providers_npi_key'
  ) THEN
    ALTER TABLE public.providers ADD CONSTRAINT providers_npi_key UNIQUE (npi);
  END IF;
END $$;

-- Create provider availability slots table
CREATE TABLE public.provider_availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  time_slot TEXT NOT NULL CHECK (time_slot IN ('early', 'middle', 'late')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(provider_id, day_of_week, time_slot)
);

-- Create appointment document shares table
CREATE TABLE public.appointment_document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.client_appointments(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id),
  provider_id UUID REFERENCES public.providers(id),
  client_id UUID,
  document_ids JSONB DEFAULT '[]'::jsonb,
  auto_selected_docs JSONB DEFAULT '[]'::jsonb,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.provider_availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_document_shares ENABLE ROW LEVEL SECURITY;

-- Update RLS on providers table
DROP POLICY IF EXISTS "Anyone can view active providers" ON public.providers;
CREATE POLICY "Anyone can view active providers"
  ON public.providers FOR SELECT
  USING (is_active = true OR user_id = auth.uid() OR has_role('RN_CCM') OR has_role('STAFF') OR has_role('ATTORNEY') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

DROP POLICY IF EXISTS "Providers can update own profile" ON public.providers;
CREATE POLICY "Providers can update own profile"
  ON public.providers FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can manage providers" ON public.providers;
CREATE POLICY "Staff can manage providers"
  ON public.providers FOR ALL
  USING (has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- RLS Policies for availability slots
CREATE POLICY "Anyone can view available slots"
  ON public.provider_availability_slots FOR SELECT
  USING (true);

CREATE POLICY "Providers can manage own slots"
  ON public.provider_availability_slots FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.providers p
    WHERE p.id = provider_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Staff can manage all slots"
  ON public.provider_availability_slots FOR ALL
  USING (has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- RLS Policies for document shares
CREATE POLICY "Users can view document shares for their cases"
  ON public.appointment_document_shares FOR SELECT
  USING (
    client_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = provider_id AND p.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM case_assignments ca WHERE ca.case_id = appointment_document_shares.case_id AND ca.user_id = auth.uid())
  );

CREATE POLICY "RN CM can manage document shares"
  ON public.appointment_document_shares FOR ALL
  USING (has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_providers_npi ON public.providers(npi);
CREATE INDEX IF NOT EXISTS idx_providers_specialty ON public.providers(specialty);
CREATE INDEX IF NOT EXISTS idx_providers_active ON public.providers(is_active);
CREATE INDEX idx_provider_slots_provider ON public.provider_availability_slots(provider_id);
CREATE INDEX idx_document_shares_status ON public.appointment_document_shares(status);

-- Add provider_id to client_appointments if not exists
ALTER TABLE public.client_appointments 
  ADD COLUMN IF NOT EXISTS provider_ref_id UUID REFERENCES public.providers(id);

-- Update triggers for new tables
CREATE TRIGGER update_provider_slots_updated_at
  BEFORE UPDATE ON public.provider_availability_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_shares_updated_at
  BEFORE UPDATE ON public.appointment_document_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();