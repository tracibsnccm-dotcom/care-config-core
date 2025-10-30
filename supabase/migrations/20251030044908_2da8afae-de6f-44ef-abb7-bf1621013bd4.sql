-- Create case_notes table for attorney and team collaboration
CREATE TABLE public.case_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  created_by uuid NOT NULL,
  note_text text NOT NULL,
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared_rn', 'shared_provider', 'shared_all')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create case_tasks table for task management
CREATE TABLE public.case_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  assigned_to uuid,
  assigned_role text CHECK (assigned_role IN ('ATTORNEY', 'RN_CCM', 'PROVIDER', 'STAFF')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_notes
CREATE POLICY "Users can view notes for their assigned cases"
ON public.case_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = case_notes.case_id 
    AND ca.user_id = auth.uid()
  )
  OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

CREATE POLICY "Users can create notes for their assigned cases"
ON public.case_notes
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = case_notes.case_id 
    AND ca.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update their own notes"
ON public.case_notes
FOR UPDATE
USING (created_by = auth.uid());

-- RLS Policies for case_tasks
CREATE POLICY "Users can view tasks for their assigned cases"
ON public.case_tasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = case_tasks.case_id 
    AND ca.user_id = auth.uid()
  )
  OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

CREATE POLICY "Users can create tasks for their assigned cases"
ON public.case_tasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = case_tasks.case_id 
    AND ca.user_id = auth.uid()
  )
  AND created_by = auth.uid()
);

CREATE POLICY "Users can update tasks"
ON public.case_tasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = case_tasks.case_id 
    AND ca.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_case_notes_case_id ON public.case_notes(case_id);
CREATE INDEX idx_case_notes_created_by ON public.case_notes(created_by);
CREATE INDEX idx_case_tasks_case_id ON public.case_tasks(case_id);
CREATE INDEX idx_case_tasks_assigned_to ON public.case_tasks(assigned_to);
CREATE INDEX idx_case_tasks_due_date ON public.case_tasks(due_date);