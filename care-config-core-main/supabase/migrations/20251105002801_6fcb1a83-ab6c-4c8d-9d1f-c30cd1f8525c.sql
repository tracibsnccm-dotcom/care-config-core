-- Update existing RN_CCM records to RN_CM
UPDATE public.user_roles 
SET role = 'RN_CM' 
WHERE role = 'RN_CCM';