-- Create management_resources table for resources library
CREATE TABLE IF NOT EXISTS public.management_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL, -- 'policy', 'template', 'guide', 'training', 'form'
  category TEXT NOT NULL, -- 'clinical', 'compliance', 'hr', 'operations', 'legal'
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  tags TEXT[],
  access_level TEXT NOT NULL DEFAULT 'all', -- 'all', 'director', 'supervisor', 'manager'
  uploaded_by UUID REFERENCES auth.users(id),
  is_featured BOOLEAN DEFAULT false,
  version TEXT DEFAULT '1.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create team_schedule_events table for scheduling calendar
CREATE TABLE IF NOT EXISTS public.team_schedule_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- 'meeting', 'pto', 'training', 'deadline', 'review'
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees UUID[],
  created_by UUID REFERENCES auth.users(id),
  case_id UUID REFERENCES public.cases(id),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  reminder_minutes INTEGER DEFAULT 15,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create management_team_cases view for team cases board
CREATE OR REPLACE VIEW public.management_team_cases AS
SELECT 
  c.id,
  c.client_number,
  c.client_label,
  c.status,
  c.created_at,
  ca.user_id as assigned_to,
  p.display_name as assigned_name,
  ur.role as assigned_role,
  (SELECT COUNT(*) FROM case_notes WHERE case_id = c.id) as note_count,
  (SELECT COUNT(*) FROM case_tasks WHERE case_id = c.id AND status = 'completed') as completed_tasks,
  (SELECT COUNT(*) FROM case_tasks WHERE case_id = c.id) as total_tasks
FROM public.cases c
LEFT JOIN public.case_assignments ca ON ca.case_id = c.id
LEFT JOIN public.profiles p ON p.user_id = ca.user_id
LEFT JOIN public.user_roles ur ON ur.user_id = ca.user_id
WHERE ca.role IN ('RN_CCM', 'STAFF');

-- Enable RLS
ALTER TABLE public.management_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_schedule_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for management_resources
CREATE POLICY "Management can view resources"
  ON public.management_resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('RN_CCM', 'STAFF', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Management can insert resources"
  ON public.management_resources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('STAFF', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Management can update resources"
  ON public.management_resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('STAFF', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Management can delete resources"
  ON public.management_resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('STAFF', 'SUPER_ADMIN')
    )
  );

-- RLS Policies for team_schedule_events
CREATE POLICY "Management can view schedule events"
  ON public.team_schedule_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('RN_CCM', 'STAFF', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Management can insert schedule events"
  ON public.team_schedule_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('RN_CCM', 'STAFF', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Management can update schedule events"
  ON public.team_schedule_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('RN_CCM', 'STAFF', 'SUPER_ADMIN')
    )
  );

CREATE POLICY "Management can delete schedule events"
  ON public.team_schedule_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('RN_CCM', 'STAFF', 'SUPER_ADMIN')
    )
  );

-- Create indexes
CREATE INDEX idx_resources_type ON public.management_resources(resource_type);
CREATE INDEX idx_resources_category ON public.management_resources(category);
CREATE INDEX idx_resources_featured ON public.management_resources(is_featured);
CREATE INDEX idx_schedule_start ON public.team_schedule_events(start_time);
CREATE INDEX idx_schedule_attendees ON public.team_schedule_events USING GIN(attendees);

-- Create updated_at triggers
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.management_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_updated_at
  BEFORE UPDATE ON public.team_schedule_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();