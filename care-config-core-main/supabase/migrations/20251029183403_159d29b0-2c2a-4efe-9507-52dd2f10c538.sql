-- ============================================================================
-- RCMS C.A.R.E. Database Schema Expansion (Fixed)
-- Adds support for providers, intakes, documents, SDOH assessments, and storage
-- ============================================================================

-- 1. Add new columns to cases table
ALTER TABLE public.cases
ADD COLUMN IF NOT EXISTS provider_routed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS specialist_report_uploaded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_pain_diary_at timestamptz,
ADD COLUMN IF NOT EXISTS pain_diary_count_30d integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS sdoh_resolved jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS odg_benchmarks jsonb DEFAULT '{"initialAssessment": false, "imagingAsIndicated": false, "returnToFunctionPlan": false, "specialistEvaluation": false, "conservativeCareTrial": false}'::jsonb,
ADD COLUMN IF NOT EXISTS flags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS documentation jsonb DEFAULT '{"diary4wks": false, "sdohAddressed": false, "fourPsComplete": false, "intakeComplete": false, "mdInitialReport": false, "specialistNeurology": false, "incidentNarrativeCaptured": false}'::jsonb;

-- 2. Create providers table
CREATE TABLE IF NOT EXISTS public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  practice_name text,
  phone text,
  email text,
  fax text,
  address text,
  npi text,
  accepting_patients boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated can view providers" ON public.providers;
CREATE POLICY "All authenticated can view providers"
ON public.providers FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Staff and above can manage providers" ON public.providers;
CREATE POLICY "Staff and above can manage providers"
ON public.providers FOR ALL
USING (
  has_role('STAFF') OR has_role('ATTORNEY') OR has_role('RN_CCM') OR 
  has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

-- 3. Create intakes table
CREATE TABLE IF NOT EXISTS public.intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  incident_date timestamptz,
  incident_type text,
  injuries text[],
  severity_self_score integer,
  initial_treatment text,
  narrative text,
  intake_data jsonb DEFAULT '{}'::jsonb,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.intakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view intakes for their cases" ON public.intakes;
CREATE POLICY "Users can view intakes for their cases"
ON public.intakes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = intakes.case_id AND ca.user_id = auth.uid()
  ) OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS "Users can insert intakes for their cases" ON public.intakes;
CREATE POLICY "Users can insert intakes for their cases"
ON public.intakes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = intakes.case_id AND ca.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Staff can update intakes" ON public.intakes;
CREATE POLICY "Staff can update intakes"
ON public.intakes FOR UPDATE
USING (
  has_role('STAFF') OR has_role('ATTORNEY') OR has_role('RN_CCM') OR 
  has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

-- 4. Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view documents for their cases" ON public.documents;
CREATE POLICY "Users can view documents for their cases"
ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = documents.case_id AND ca.user_id = auth.uid()
  ) OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS "Users can upload documents for their cases" ON public.documents;
CREATE POLICY "Users can upload documents for their cases"
ON public.documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = documents.case_id AND ca.user_id = auth.uid()
  )
);

-- 5. Create SDOH assessments table
CREATE TABLE IF NOT EXISTS public.sdoh_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  housing boolean DEFAULT false,
  food boolean DEFAULT false,
  transport boolean DEFAULT false,
  insurance_gap boolean DEFAULT false,
  resolved jsonb DEFAULT '{}'::jsonb,
  notes text,
  assessed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sdoh_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view SDOH for their cases" ON public.sdoh_assessments;
CREATE POLICY "Users can view SDOH for their cases"
ON public.sdoh_assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = sdoh_assessments.case_id AND ca.user_id = auth.uid()
  ) OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

DROP POLICY IF EXISTS "RN and staff can manage SDOH assessments" ON public.sdoh_assessments;
CREATE POLICY "RN and staff can manage SDOH assessments"
ON public.sdoh_assessments FOR ALL
USING (
  has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF') OR 
  has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

-- 6. Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('case-documents', 'case-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('receipts', 'receipts', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- 7. Storage RLS policies for case-documents (FIXED SYNTAX)
DROP POLICY IF EXISTS "Users can view case documents for their cases" ON storage.objects;
CREATE POLICY "Users can view case documents for their cases"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'case-documents' AND
  (
    EXISTS (
      SELECT 1 FROM documents d
      JOIN case_assignments ca ON d.case_id = ca.case_id
      WHERE (storage.foldername(name))[1] = d.case_id::text
        AND ca.user_id = auth.uid()
    ) OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
  )
);

DROP POLICY IF EXISTS "Users can upload case documents for their cases" ON storage.objects;
CREATE POLICY "Users can upload case documents for their cases"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'case-documents' AND
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE (storage.foldername(name))[1] = ca.case_id::text
      AND ca.user_id = auth.uid()
  )
);

-- 8. Storage RLS policies for receipts (FIXED SYNTAX)
DROP POLICY IF EXISTS "Users can view receipts for their cases" ON storage.objects;
CREATE POLICY "Users can view receipts for their cases"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND
  (
    EXISTS (
      SELECT 1 FROM case_assignments ca
      WHERE (storage.foldername(name))[1] = ca.case_id::text
        AND ca.user_id = auth.uid()
    ) OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
  )
);

DROP POLICY IF EXISTS "Users can upload receipts for their cases" ON storage.objects;
CREATE POLICY "Users can upload receipts for their cases"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE (storage.foldername(name))[1] = ca.case_id::text
      AND ca.user_id = auth.uid()
  )
);

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_intakes_case_id ON public.intakes(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_sdoh_case_id ON public.sdoh_assessments(case_id);
CREATE INDEX IF NOT EXISTS idx_providers_specialty ON public.providers(specialty);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);

-- 10. Create updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  return new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_providers_updated_at ON public.providers;
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_intakes_updated_at ON public.intakes;
CREATE TRIGGER update_intakes_updated_at
  BEFORE UPDATE ON public.intakes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_sdoh_updated_at ON public.sdoh_assessments;
CREATE TRIGGER update_sdoh_updated_at
  BEFORE UPDATE ON public.sdoh_assessments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();