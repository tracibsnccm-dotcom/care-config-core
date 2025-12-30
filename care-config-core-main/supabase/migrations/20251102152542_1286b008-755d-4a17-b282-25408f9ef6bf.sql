-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create table for client treatments/services
CREATE TABLE IF NOT EXISTS public.client_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  case_id UUID NOT NULL,
  treatment_name TEXT NOT NULL,
  frequency TEXT,
  injury_timing TEXT CHECK (injury_timing IN ('pre_injury', 'post_injury')),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT CHECK (length(notes) <= 1000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_treatments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own treatments"
  ON public.client_treatments
  FOR SELECT
  USING (
    auth.uid() = client_id OR 
    has_role('RN_CCM') OR 
    has_role('ATTORNEY') OR 
    has_role('STAFF')
  );

CREATE POLICY "Users can create their own treatments"
  ON public.client_treatments
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own treatments"
  ON public.client_treatments
  FOR UPDATE
  USING (
    auth.uid() = client_id OR 
    has_role('RN_CCM') OR 
    has_role('ATTORNEY')
  );

-- Create index for faster queries
CREATE INDEX idx_client_treatments_client_id ON public.client_treatments(client_id);
CREATE INDEX idx_client_treatments_case_id ON public.client_treatments(case_id);
CREATE INDEX idx_client_treatments_injury_timing ON public.client_treatments(injury_timing);

-- Create trigger for updated_at
CREATE TRIGGER update_client_treatments_updated_at
  BEFORE UPDATE ON public.client_treatments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();