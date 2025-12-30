-- Create RN assignments tracking table
CREATE TABLE IF NOT EXISTS public.rn_case_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  rn_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_by UUID,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assessments tracking table
CREATE TABLE IF NOT EXISTS public.rn_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  rn_id UUID NOT NULL,
  assessment_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  requires_followup BOOLEAN DEFAULT false,
  followup_reason TEXT,
  followup_due_date DATE,
  assessment_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RN diary/calendar entries table
CREATE TABLE IF NOT EXISTS public.rn_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  rn_id UUID NOT NULL,
  entry_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  duration_minutes INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled',
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.rn_case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_diary_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rn_case_assignments
CREATE POLICY "RN can view their own assignments"
  ON public.rn_case_assignments FOR SELECT
  USING (rn_id = auth.uid() OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Supervisors can view all assignments"
  ON public.rn_case_assignments FOR SELECT
  USING (has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Supervisors can create assignments"
  ON public.rn_case_assignments FOR INSERT
  WITH CHECK (has_role('RN_CCM') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Supervisors can update assignments"
  ON public.rn_case_assignments FOR UPDATE
  USING (has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- RLS Policies for rn_assessments
CREATE POLICY "RN can view their own assessments"
  ON public.rn_assessments FOR SELECT
  USING (rn_id = auth.uid() OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "RN can create assessments"
  ON public.rn_assessments FOR INSERT
  WITH CHECK (rn_id = auth.uid() OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "RN can update their own assessments"
  ON public.rn_assessments FOR UPDATE
  USING (rn_id = auth.uid() OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- RLS Policies for rn_diary_entries
CREATE POLICY "RN can view their own diary entries"
  ON public.rn_diary_entries FOR SELECT
  USING (rn_id = auth.uid() OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Supervisors can view all diary entries"
  ON public.rn_diary_entries FOR SELECT
  USING (has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Users can create diary entries"
  ON public.rn_diary_entries FOR INSERT
  WITH CHECK (has_role('RN_CCM') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "RN can update their own diary entries"
  ON public.rn_diary_entries FOR UPDATE
  USING (rn_id = auth.uid() OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Supervisors can update all diary entries"
  ON public.rn_diary_entries FOR UPDATE
  USING (has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Create updated_at triggers
CREATE TRIGGER update_rn_case_assignments_updated_at
  BEFORE UPDATE ON public.rn_case_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_rn_assessments_updated_at
  BEFORE UPDATE ON public.rn_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_rn_diary_entries_updated_at
  BEFORE UPDATE ON public.rn_diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_rn_case_assignments_rn_id ON public.rn_case_assignments(rn_id);
CREATE INDEX idx_rn_case_assignments_case_id ON public.rn_case_assignments(case_id);
CREATE INDEX idx_rn_case_assignments_status ON public.rn_case_assignments(status);

CREATE INDEX idx_rn_assessments_rn_id ON public.rn_assessments(rn_id);
CREATE INDEX idx_rn_assessments_status ON public.rn_assessments(status);
CREATE INDEX idx_rn_assessments_requires_followup ON public.rn_assessments(requires_followup);

CREATE INDEX idx_rn_diary_entries_rn_id ON public.rn_diary_entries(rn_id);
CREATE INDEX idx_rn_diary_entries_scheduled_date ON public.rn_diary_entries(scheduled_date);
CREATE INDEX idx_rn_diary_entries_entry_type ON public.rn_diary_entries(entry_type);
CREATE INDEX idx_rn_diary_entries_status ON public.rn_diary_entries(status);

-- Function to automatically create diary entry when appointment is created
CREATE OR REPLACE FUNCTION public.create_diary_entry_for_appointment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_rn_id UUID;
BEGIN
  -- Get the RN assigned to this case
  SELECT rn_id INTO assigned_rn_id
  FROM public.rn_case_assignments
  WHERE case_id = NEW.case_id
    AND status = 'active'
  ORDER BY assigned_at DESC
  LIMIT 1;
  
  IF assigned_rn_id IS NOT NULL THEN
    -- Create diary entry for the appointment
    INSERT INTO public.rn_diary_entries (
      case_id,
      rn_id,
      entry_type,
      title,
      description,
      scheduled_date,
      scheduled_time,
      location,
      metadata,
      created_by
    ) VALUES (
      NEW.case_id,
      assigned_rn_id,
      'client_appointment',
      NEW.title,
      NEW.notes,
      NEW.appointment_date,
      NEW.appointment_time,
      NEW.location,
      jsonb_build_object(
        'appointment_id', NEW.id,
        'provider_name', NEW.provider_name,
        'client_id', NEW.client_id
      ),
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create diary entries for appointments
CREATE TRIGGER auto_create_diary_entry_for_appointment
  AFTER INSERT ON public.client_appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.create_diary_entry_for_appointment();