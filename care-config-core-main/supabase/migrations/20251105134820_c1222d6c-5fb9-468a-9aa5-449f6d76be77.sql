-- Client Education Material Library
CREATE TABLE IF NOT EXISTS public.education_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  diagnosis_tags TEXT[],
  treatment_tags TEXT[],
  material_type TEXT NOT NULL CHECK (material_type IN ('pdf', 'video', 'article', 'infographic', 'checklist', 'guide')),
  file_url TEXT,
  external_url TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  reading_level TEXT CHECK (reading_level IN ('elementary', 'middle_school', 'high_school', 'college', 'general')),
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_education_materials_category ON public.education_materials(category);
CREATE INDEX idx_education_materials_diagnosis ON public.education_materials USING GIN(diagnosis_tags);
CREATE INDEX idx_education_materials_active ON public.education_materials(is_active);

-- Track client access to materials
CREATE TABLE IF NOT EXISTS public.client_education_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID REFERENCES public.education_materials(id) ON DELETE CASCADE,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id),
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  UNIQUE(material_id, client_id, case_id)
);

-- Care Plan Reminders
CREATE TABLE IF NOT EXISTS public.care_plan_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  care_plan_id UUID REFERENCES public.care_plans(id) ON DELETE CASCADE,
  rn_id UUID REFERENCES auth.users(id),
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('review_due', 'update_required', 'goal_check', 'assessment_due', 'custom')),
  reminder_date DATE NOT NULL,
  reminder_time TIME,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  title TEXT NOT NULL,
  description TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly')),
  recurrence_end_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'completed', 'dismissed', 'overdue')),
  sent_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  dismissed_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_care_plan_reminders_rn ON public.care_plan_reminders(rn_id);
CREATE INDEX idx_care_plan_reminders_date ON public.care_plan_reminders(reminder_date);
CREATE INDEX idx_care_plan_reminders_status ON public.care_plan_reminders(status);

-- RN-to-RN Handoff System
CREATE TABLE IF NOT EXISTS public.case_handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  from_rn_id UUID REFERENCES auth.users(id) NOT NULL,
  to_rn_id UUID REFERENCES auth.users(id) NOT NULL,
  handoff_reason TEXT NOT NULL CHECK (handoff_reason IN ('workload_balance', 'leave_of_absence', 'specialty_required', 'geographic', 'client_request', 'performance', 'other')),
  handoff_reason_notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')),
  
  -- Handoff Summary
  client_summary TEXT NOT NULL,
  current_status TEXT NOT NULL,
  active_diagnoses TEXT[],
  current_medications TEXT,
  active_treatments TEXT,
  key_contacts TEXT,
  
  -- Care Plan Info
  care_plan_summary TEXT,
  short_term_goals TEXT,
  long_term_goals TEXT,
  
  -- Critical Information
  critical_alerts TEXT,
  safety_concerns TEXT,
  pending_tasks TEXT,
  upcoming_appointments TEXT,
  
  -- Insurance & Legal
  insurance_status TEXT,
  authorization_status TEXT,
  attorney_contact TEXT,
  
  -- Handoff Timeline
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  effective_date DATE,
  
  -- Checklist
  checklist_items JSONB DEFAULT '[]'::jsonb,
  checklist_completed BOOLEAN DEFAULT false,
  
  -- Attachments & Notes
  handoff_documents UUID[],
  transition_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_case_handoffs_from_rn ON public.case_handoffs(from_rn_id);
CREATE INDEX idx_case_handoffs_to_rn ON public.case_handoffs(to_rn_id);
CREATE INDEX idx_case_handoffs_status ON public.case_handoffs(status);
CREATE INDEX idx_case_handoffs_case ON public.case_handoffs(case_id);

-- Clinical Decision Support Placeholder (ODG/MCG)
CREATE TABLE IF NOT EXISTS public.clinical_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guideline_source TEXT NOT NULL CHECK (guideline_source IN ('odg', 'mcg', 'internal', 'acoem', 'other')),
  diagnosis_code TEXT NOT NULL,
  diagnosis_name TEXT NOT NULL,
  treatment_category TEXT NOT NULL,
  guideline_title TEXT NOT NULL,
  guideline_summary TEXT,
  recommended_duration TEXT,
  frequency_guidelines TEXT,
  criteria_for_approval TEXT,
  red_flags TEXT[],
  contraindications TEXT[],
  evidence_level TEXT CHECK (evidence_level IN ('strong', 'moderate', 'limited', 'expert_opinion')),
  last_updated_date DATE,
  guideline_url TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_clinical_guidelines_diagnosis ON public.clinical_guidelines(diagnosis_code);
CREATE INDEX idx_clinical_guidelines_source ON public.clinical_guidelines(guideline_source);
CREATE INDEX idx_clinical_guidelines_active ON public.clinical_guidelines(is_active);

-- Workflow Templates
CREATE TABLE IF NOT EXISTS public.care_workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('intake', 'assessment', 'care_coordination', 'discharge', 'custom')),
  diagnosis_specific TEXT[],
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  estimated_duration_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Applied Workflows
CREATE TABLE IF NOT EXISTS public.case_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.care_workflow_templates(id),
  workflow_name TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  steps JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Voice Notes / Transcriptions
CREATE TABLE IF NOT EXISTS public.voice_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  audio_file_url TEXT,
  transcription_text TEXT,
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  confidence_score DECIMAL(5,2),
  duration_seconds INTEGER,
  note_type TEXT,
  ai_summary TEXT,
  ai_key_points TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.education_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_education_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_plan_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_transcriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Education Materials
CREATE POLICY "RN CMs can view all education materials"
  ON public.education_materials FOR SELECT
  TO authenticated
  USING (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "RN CMs can create education materials"
  ON public.education_materials FOR INSERT
  TO authenticated
  WITH CHECK (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "RN CMs can update education materials"
  ON public.education_materials FOR UPDATE
  TO authenticated
  USING (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- Client Education Access
CREATE POLICY "Clients can view their shared materials"
  ON public.client_education_access FOR SELECT
  TO authenticated
  USING (client_id = auth.uid() OR has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR'));

CREATE POLICY "RN CMs can share materials"
  ON public.client_education_access FOR INSERT
  TO authenticated
  WITH CHECK (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR'));

-- Care Plan Reminders
CREATE POLICY "RN CMs can manage their reminders"
  ON public.care_plan_reminders FOR ALL
  TO authenticated
  USING (rn_id = auth.uid() OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- Case Handoffs
CREATE POLICY "RN CMs can view their handoffs"
  ON public.case_handoffs FOR SELECT
  TO authenticated
  USING (from_rn_id = auth.uid() OR to_rn_id = auth.uid() OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "RN CMs can create handoffs"
  ON public.case_handoffs FOR INSERT
  TO authenticated
  WITH CHECK (from_rn_id = auth.uid() OR has_role('RN_CCM_DIRECTOR'));

CREATE POLICY "RN CMs can update handoffs"
  ON public.case_handoffs FOR UPDATE
  TO authenticated
  USING (from_rn_id = auth.uid() OR to_rn_id = auth.uid() OR has_role('RN_CCM_DIRECTOR'));

-- Clinical Guidelines
CREATE POLICY "All authenticated users can view clinical guidelines"
  ON public.clinical_guidelines FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Workflow Templates
CREATE POLICY "RN CMs can view workflow templates"
  ON public.care_workflow_templates FOR SELECT
  TO authenticated
  USING (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "RN CMs can create workflow templates"
  ON public.care_workflow_templates FOR INSERT
  TO authenticated
  WITH CHECK (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR'));

-- Case Workflows
CREATE POLICY "RN CMs can manage case workflows"
  ON public.case_workflows FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM case_assignments ca
      WHERE ca.case_id = case_workflows.case_id
      AND ca.user_id = auth.uid()
      AND ca.role = 'RN_CCM'
    ) OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN')
  );

-- Voice Transcriptions
CREATE POLICY "RN CMs can manage their transcriptions"
  ON public.voice_transcriptions FOR ALL
  TO authenticated
  USING (created_by = auth.uid() OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- Triggers
CREATE TRIGGER update_education_materials_updated_at
  BEFORE UPDATE ON public.education_materials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_plan_reminders_updated_at
  BEFORE UPDATE ON public.care_plan_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_handoffs_updated_at
  BEFORE UPDATE ON public.case_handoffs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_guidelines_updated_at
  BEFORE UPDATE ON public.clinical_guidelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_care_workflow_templates_updated_at
  BEFORE UPDATE ON public.care_workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_workflows_updated_at
  BEFORE UPDATE ON public.case_workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voice_transcriptions_updated_at
  BEFORE UPDATE ON public.voice_transcriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();