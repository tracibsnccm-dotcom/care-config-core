-- Add detail fields for the radio button questions
ALTER TABLE public.concerns
ADD COLUMN felt_respected_details text,
ADD COLUMN care_addressed_details text;