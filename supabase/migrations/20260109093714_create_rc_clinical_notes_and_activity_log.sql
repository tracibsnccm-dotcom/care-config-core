-- Create rc_clinical_notes and rc_activity_log tables for RN components
-- Migration: Create missing rc_* tables for rewiring RN components

-- RN Clinical Notes (private to RN)
CREATE TABLE IF NOT EXISTS public.rc_clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.rc_cases(id) ON DELETE CASCADE,
  note_text TEXT NOT NULL,
  created_by UUID REFERENCES public.rc_users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Activity Log (shared with client/attorney)
CREATE TABLE IF NOT EXISTS public.rc_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.rc_cases(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_detail TEXT,
  activity_date TIMESTAMPTZ DEFAULT now(),
  show_to_client BOOLEAN DEFAULT true,
  show_to_attorney BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.rc_users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rc_clinical_notes_case_id ON public.rc_clinical_notes(case_id);
CREATE INDEX IF NOT EXISTS idx_rc_activity_log_case_id ON public.rc_activity_log(case_id);

-- RLS (permissive for now)
ALTER TABLE public.rc_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rc_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_rc_clinical_notes" ON public.rc_clinical_notes FOR ALL USING (true);
CREATE POLICY "allow_all_rc_activity_log" ON public.rc_activity_log FOR ALL USING (true);
