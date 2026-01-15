-- Migration: Add purpose and prn columns to rc_client_medications
-- Also ensure rc_cases has fourps and sdoh columns

-- Add purpose and prn to rc_client_medications
ALTER TABLE public.rc_client_medications
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS prn BOOLEAN DEFAULT false;

-- Add fourps and sdoh columns to rc_cases if they don't exist
ALTER TABLE public.rc_cases
ADD COLUMN IF NOT EXISTS fourps JSONB,
ADD COLUMN IF NOT EXISTS sdoh JSONB;

-- Add comments for documentation
COMMENT ON COLUMN public.rc_client_medications.purpose IS 'What the medication is for (e.g., pain, blood pressure)';
COMMENT ON COLUMN public.rc_client_medications.prn IS 'Whether the medication is taken as needed (PRN)';
COMMENT ON COLUMN public.rc_cases.fourps IS '4Ps assessment scores: physical, psychological, psychosocial, professional';
COMMENT ON COLUMN public.rc_cases.sdoh IS 'SDOH assessment data: housing, food, transport, insurance, financial, employment, social_support, safety, healthcare_access, income_range';
