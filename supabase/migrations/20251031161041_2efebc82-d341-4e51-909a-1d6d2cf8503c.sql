-- Add client ID tracking fields to cases table
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS client_number TEXT,
ADD COLUMN IF NOT EXISTS attorney_code TEXT,
ADD COLUMN IF NOT EXISTS client_type TEXT CHECK (client_type IN ('D', 'R', 'I')) DEFAULT 'I',
ADD COLUMN IF NOT EXISTS original_intake_id UUID,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cases_attorney_code_type ON public.cases(attorney_code, client_type);
CREATE INDEX IF NOT EXISTS idx_cases_client_number ON public.cases(client_number);

-- Function to get next client number
CREATE OR REPLACE FUNCTION get_next_client_number(p_attorney_code TEXT, p_client_type TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_next_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(client_number::INTEGER), 0) + 1
  INTO v_next_number
  FROM public.cases
  WHERE attorney_code = p_attorney_code
    AND client_type = p_client_type
    AND client_number ~ '^\d+$';
  
  RETURN v_next_number;
END;
$$;

-- Function to generate client ID
CREATE OR REPLACE FUNCTION generate_client_id(p_attorney_code TEXT, p_client_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_code TEXT;
  v_number INTEGER;
  v_formatted_number TEXT;
BEGIN
  -- For internal/organic leads, use "INT" as the code
  v_code := CASE WHEN p_client_type = 'I' THEN 'INT' ELSE UPPER(p_attorney_code) END;
  
  -- Get next sequential number
  v_number := get_next_client_number(v_code, p_client_type);
  
  -- Format to 5 digits
  v_formatted_number := LPAD(v_number::TEXT, 5, '0');
  
  -- Return formatted ID
  RETURN v_code || '-' || v_formatted_number || '-' || p_client_type;
END;
$$;

-- Function to convert internal lead to attorney case
CREATE OR REPLACE FUNCTION convert_to_attorney_case(p_internal_case_id UUID, p_attorney_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_new_client_id TEXT;
  v_new_case_id UUID;
BEGIN
  -- Mark original as converted
  UPDATE public.cases
  SET 
    status = 'Converted to Attorney',
    converted_at = now(),
    updated_at = now()
  WHERE id = p_internal_case_id
    AND client_type = 'I';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid internal case ID');
  END IF;
  
  -- Generate new client ID for attorney
  v_new_client_id := generate_client_id(p_attorney_code, 'R');
  
  RETURN jsonb_build_object(
    'success', true,
    'newClientId', v_new_client_id
  );
END;
$$;