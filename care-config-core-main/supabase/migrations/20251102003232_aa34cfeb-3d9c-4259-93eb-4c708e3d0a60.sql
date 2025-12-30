-- Add SDOH columns to client_checkins table for ongoing tracking
ALTER TABLE public.client_checkins
ADD COLUMN sdoh_housing integer CHECK (sdoh_housing >= 0 AND sdoh_housing <= 4),
ADD COLUMN sdoh_food integer CHECK (sdoh_food >= 0 AND sdoh_food <= 4),
ADD COLUMN sdoh_transport integer CHECK (sdoh_transport >= 0 AND sdoh_transport <= 4),
ADD COLUMN sdoh_insurance integer CHECK (sdoh_insurance >= 0 AND sdoh_insurance <= 4),
ADD COLUMN sdoh_financial integer CHECK (sdoh_financial >= 0 AND sdoh_financial <= 4),
ADD COLUMN sdoh_employment integer CHECK (sdoh_employment >= 0 AND sdoh_employment <= 4),
ADD COLUMN sdoh_social_support integer CHECK (sdoh_social_support >= 0 AND sdoh_social_support <= 4),
ADD COLUMN sdoh_safety integer CHECK (sdoh_safety >= 0 AND sdoh_safety <= 4),
ADD COLUMN sdoh_healthcare_access integer CHECK (sdoh_healthcare_access >= 0 AND sdoh_healthcare_access <= 4),
ADD COLUMN sdoh_income_range text;

-- Add comment explaining the SDOH scale
COMMENT ON COLUMN public.client_checkins.sdoh_housing IS 'Housing stability: 0 (doing fine) to 4 (severe difficulty)';
COMMENT ON COLUMN public.client_checkins.sdoh_food IS 'Food security: 0 (doing fine) to 4 (severe difficulty)';
COMMENT ON COLUMN public.client_checkins.sdoh_transport IS 'Transportation access: 0 (doing fine) to 4 (severe difficulty)';
COMMENT ON COLUMN public.client_checkins.sdoh_insurance IS 'Insurance coverage: 0 (doing fine) to 4 (severe difficulty)';
COMMENT ON COLUMN public.client_checkins.sdoh_financial IS 'Financial resources: 0 (doing fine) to 4 (severe difficulty)';
COMMENT ON COLUMN public.client_checkins.sdoh_employment IS 'Employment status: 0 (doing fine) to 4 (severe difficulty)';
COMMENT ON COLUMN public.client_checkins.sdoh_social_support IS 'Social support network: 0 (doing fine) to 4 (severe difficulty)';
COMMENT ON COLUMN public.client_checkins.sdoh_safety IS 'Safety and security: 0 (doing fine) to 4 (severe difficulty)';
COMMENT ON COLUMN public.client_checkins.sdoh_healthcare_access IS 'Healthcare access: 0 (doing fine) to 4 (severe difficulty)';