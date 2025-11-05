-- Create staff_members table for staff management
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  hire_date DATE NOT NULL,
  employment_status TEXT NOT NULL DEFAULT 'active',
  supervisor_id UUID REFERENCES public.staff_members(id),
  certifications JSONB DEFAULT '[]'::jsonb,
  performance_score DECIMAL(5,2),
  caseload_count INTEGER DEFAULT 0,
  specializations TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_members
CREATE POLICY "Staff members viewable by management and staff"
ON public.staff_members FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles 
    WHERE role IN ('RN_CM_DIRECTOR', 'RN_CM_SUPERVISOR', 'RN_CM_MANAGER', 'RN_CCM', 'SUPER_ADMIN')
  )
);

CREATE POLICY "Staff members manageable by directors and supervisors"
ON public.staff_members FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles 
    WHERE role IN ('RN_CM_DIRECTOR', 'RN_CM_SUPERVISOR', 'SUPER_ADMIN')
  )
);

CREATE POLICY "Staff members updatable by directors and supervisors"
ON public.staff_members FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles 
    WHERE role IN ('RN_CM_DIRECTOR', 'RN_CM_SUPERVISOR', 'SUPER_ADMIN')
  )
);

CREATE POLICY "Staff members deletable by directors only"
ON public.staff_members FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM public.user_roles 
    WHERE role IN ('RN_CM_DIRECTOR', 'SUPER_ADMIN')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_staff_members_updated_at
BEFORE UPDATE ON public.staff_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_staff_members_role ON public.staff_members(role);
CREATE INDEX idx_staff_members_department ON public.staff_members(department);
CREATE INDEX idx_staff_members_status ON public.staff_members(employment_status);
CREATE INDEX idx_staff_members_supervisor ON public.staff_members(supervisor_id);