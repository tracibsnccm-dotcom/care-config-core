-- Create intake_drafts table for autosave functionality
CREATE TABLE public.intake_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  case_id UUID,
  step INTEGER NOT NULL DEFAULT 0,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS
ALTER TABLE public.intake_drafts ENABLE ROW LEVEL SECURITY;

-- Users can manage their own drafts
CREATE POLICY "Users can view their own drafts"
ON public.intake_drafts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts"
ON public.intake_drafts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
ON public.intake_drafts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
ON public.intake_drafts
FOR DELETE
USING (auth.uid() = user_id);

-- Create medications reference table
CREATE TABLE public.medications_reference (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  form TEXT,
  strength TEXT,
  search_text TEXT GENERATED ALWAYS AS (lower(name || ' ' || COALESCE(generic_name, '') || ' ' || COALESCE(strength, ''))) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS (public read access)
ALTER TABLE public.medications_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read medications"
ON public.medications_reference
FOR SELECT
USING (true);

CREATE POLICY "Staff can manage medications"
ON public.medications_reference
FOR ALL
USING (has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Create index for fast medication search
CREATE INDEX idx_medications_search ON public.medications_reference USING gin(to_tsvector('english', search_text));
CREATE INDEX idx_medications_name ON public.medications_reference(name);

-- Create intake_uploads table for file tracking
CREATE TABLE public.intake_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  intake_draft_id UUID REFERENCES public.intake_drafts(id) ON DELETE CASCADE,
  case_id UUID,
  uploaded_by UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.intake_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uploads"
ON public.intake_uploads
FOR SELECT
USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can insert their own uploads"
ON public.intake_uploads
FOR INSERT
WITH CHECK (auth.uid() = uploaded_by);

-- Staff can view all uploads
CREATE POLICY "Staff can view all uploads"
ON public.intake_uploads
FOR SELECT
USING (has_role('STAFF') OR has_role('RN_CCM') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Insert sample medications data
INSERT INTO public.medications_reference (name, generic_name, form, strength) VALUES
  ('Gabapentin', 'Gabapentin', 'Capsule', '300mg'),
  ('Gabapentin', 'Gabapentin', 'Capsule', '600mg'),
  ('Ibuprofen', 'Ibuprofen', 'Tablet', '200mg'),
  ('Ibuprofen', 'Ibuprofen', 'Tablet', '800mg'),
  ('Acetaminophen', 'Acetaminophen', 'Tablet', '500mg'),
  ('Tramadol', 'Tramadol', 'Tablet', '50mg'),
  ('Cyclobenzaprine', 'Cyclobenzaprine', 'Tablet', '10mg'),
  ('Meloxicam', 'Meloxicam', 'Tablet', '15mg'),
  ('Naproxen', 'Naproxen', 'Tablet', '500mg'),
  ('Amitriptyline', 'Amitriptyline', 'Tablet', '25mg');

-- Create trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_intake_draft_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_intake_drafts_updated_at
BEFORE UPDATE ON public.intake_drafts
FOR EACH ROW
EXECUTE FUNCTION update_intake_draft_timestamp();