-- Create client_allergies table
CREATE TABLE IF NOT EXISTS public.client_allergies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  case_id UUID NOT NULL,
  allergen_name TEXT NOT NULL,
  reaction TEXT,
  severity TEXT,
  notes TEXT,
  reported_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_allergies ENABLE ROW LEVEL SECURITY;

-- Create policies for client_allergies
CREATE POLICY "Users can view their own allergies"
ON public.client_allergies
FOR SELECT
USING (
  auth.uid() = client_id OR 
  has_role('RN_CCM') OR 
  has_role('ATTORNEY') OR 
  has_role('STAFF') OR
  has_role('SUPER_USER') OR
  has_role('SUPER_ADMIN')
);

CREATE POLICY "Users can create their own allergies"
ON public.client_allergies
FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own allergies"
ON public.client_allergies
FOR UPDATE
USING (
  auth.uid() = client_id OR 
  has_role('RN_CCM') OR 
  has_role('ATTORNEY')
);

-- Create index for faster lookups
CREATE INDEX idx_client_allergies_client_id ON public.client_allergies(client_id);
CREATE INDEX idx_client_allergies_case_id ON public.client_allergies(case_id);

-- Add trigger for updated_at
CREATE TRIGGER update_client_allergies_updated_at
BEFORE UPDATE ON public.client_allergies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();