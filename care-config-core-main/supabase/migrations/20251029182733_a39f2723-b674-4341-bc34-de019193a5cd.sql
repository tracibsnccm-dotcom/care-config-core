-- ============================================================================
-- RCMS C.A.R.E. — Expanded Schema for Attorney Portal Intelligence
-- ============================================================================

-- 1) Add missing fields to cases table
ALTER TABLE public.cases 
ADD COLUMN IF NOT EXISTS provider_routed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS specialist_report_uploaded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_pain_diary_at timestamptz,
ADD COLUMN IF NOT EXISTS pain_diary_count_30d integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS flags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sdoh_resolved jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS odg_benchmarks jsonb DEFAULT '{
  "initialAssessment": false,
  "imagingAsIndicated": false,
  "conservativeCareTrial": false,
  "specialistEvaluation": false,
  "returnToFunctionPlan": false
}',
ADD COLUMN IF NOT EXISTS documentation jsonb DEFAULT '{
  "fourPsComplete": false,
  "intakeComplete": false,
  "incidentNarrativeCaptured": false,
  "mdInitialReport": false,
  "specialistNeurology": false,
  "diary4wks": false,
  "sdohAddressed": false
}';

-- 2) Create providers table
CREATE TABLE IF NOT EXISTS public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialty text NOT NULL,
  practice_name text,
  address text,
  phone text,
  email text,
  fax text,
  npi text,
  accepting_patients boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and above can manage providers"
ON public.providers FOR ALL
USING (
  has_role('STAFF') OR has_role('ATTORNEY') OR 
  has_role('RN_CCM') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

CREATE POLICY "All authenticated can view providers"
ON public.providers FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3) Create intakes table (detailed intake data)
CREATE TABLE IF NOT EXISTS public.intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  incident_type text,
  incident_date timestamptz,
  initial_treatment text,
  injuries text[],
  severity_self_score integer CHECK (severity_self_score BETWEEN 0 AND 10),
  narrative text,
  intake_data jsonb DEFAULT '{}',
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert intakes for their cases"
ON public.intakes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = intakes.case_id AND ca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view intakes for their cases"
ON public.intakes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = intakes.case_id AND ca.user_id = auth.uid()
  ) OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

CREATE POLICY "Staff can update intakes"
ON public.intakes FOR UPDATE
USING (
  has_role('STAFF') OR has_role('ATTORNEY') OR 
  has_role('RN_CCM') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

-- 4) Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id),
  document_type text NOT NULL, -- 'SPECIALIST_REPORT', 'RECEIPT', 'MD_REPORT', etc.
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upload documents for their cases"
ON public.documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = documents.case_id AND ca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view documents for their cases"
ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = documents.case_id AND ca.user_id = auth.uid()
  ) OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

-- 5) Create SDOH assessments table
CREATE TABLE IF NOT EXISTS public.sdoh_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  assessed_by uuid REFERENCES auth.users(id),
  housing boolean DEFAULT false,
  food boolean DEFAULT false,
  transport boolean DEFAULT false,
  insurance_gap boolean DEFAULT false,
  notes text,
  resolved jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sdoh_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "RN and staff can manage SDOH assessments"
ON public.sdoh_assessments FOR ALL
USING (
  has_role('RN_CCM') OR has_role('ATTORNEY') OR 
  has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

CREATE POLICY "Users can view SDOH for their cases"
ON public.sdoh_assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = sdoh_assessments.case_id AND ca.user_id = auth.uid()
  ) OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

-- 6) Create storage buckets for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('case-documents', 'case-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']),
  ('receipts', 'receipts', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for case-documents
CREATE POLICY "Users can upload documents for their cases"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'case-documents' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view documents for their cases"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'case-documents' AND
  auth.uid() IS NOT NULL
);

-- Storage policies for receipts
CREATE POLICY "Users can upload receipts for their cases"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view their uploaded receipts"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'receipts' AND
  auth.uid() IS NOT NULL
);

-- 7) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_provider_routed ON public.cases(provider_routed);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_last_pain_diary ON public.cases(last_pain_diary_at);
CREATE INDEX IF NOT EXISTS idx_intakes_case_id ON public.intakes(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_sdoh_case_id ON public.sdoh_assessments(case_id);
CREATE INDEX IF NOT EXISTS idx_providers_specialty ON public.providers(specialty);

-- 8) Add triggers for updated_at
CREATE TRIGGER update_providers_updated_at
BEFORE UPDATE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_intakes_updated_at
BEFORE UPDATE ON public.intakes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_sdoh_updated_at
BEFORE UPDATE ON public.sdoh_assessments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();