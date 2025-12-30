-- Add color coding, labels, dependencies, and approval workflow to diary entries
ALTER TABLE public.rn_diary_entries
ADD COLUMN IF NOT EXISTS label TEXT,
ADD COLUMN IF NOT EXISTS label_color TEXT DEFAULT 'gray',
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected')) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Create entry dependencies table
CREATE TABLE IF NOT EXISTS public.rn_diary_entry_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.rn_diary_entries(id) ON DELETE CASCADE,
  depends_on_entry_id UUID NOT NULL REFERENCES public.rn_diary_entries(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'related', 'follows')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(entry_id, depends_on_entry_id)
);

-- Enable RLS on dependencies
ALTER TABLE public.rn_diary_entry_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS policies for dependencies
CREATE POLICY "Users can view dependencies for their entries"
ON public.rn_diary_entry_dependencies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rn_diary_entries
    WHERE id = entry_id AND rn_id = auth.uid()
  ) OR
  has_role('SUPER_ADMIN'::text)
);

CREATE POLICY "Users can create dependencies for their entries"
ON public.rn_diary_entry_dependencies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rn_diary_entries
    WHERE id = entry_id AND rn_id = auth.uid()
  )
);

CREATE POLICY "Users can delete dependencies for their entries"
ON public.rn_diary_entry_dependencies FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.rn_diary_entries
    WHERE id = entry_id AND rn_id = auth.uid()
  )
);

-- Function to check if entry requires approval based on type
CREATE OR REPLACE FUNCTION public.set_diary_approval_requirement()
RETURNS TRIGGER AS $$
BEGIN
  -- Require approval for emergency alerts and critical health entries
  IF NEW.entry_type IN ('emergency_alert', 'critical_health', 'hospital_admission', 'er_visit', 'crisis_intervention') THEN
    NEW.requires_approval := true;
    NEW.approval_status := 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-set approval requirement
DROP TRIGGER IF EXISTS set_approval_requirement_trigger ON public.rn_diary_entries;
CREATE TRIGGER set_approval_requirement_trigger
BEFORE INSERT ON public.rn_diary_entries
FOR EACH ROW
EXECUTE FUNCTION public.set_diary_approval_requirement();

-- Function to notify supervisor when approval is needed
CREATE OR REPLACE FUNCTION public.notify_supervisor_for_approval()
RETURNS TRIGGER AS $$
DECLARE
  rn_name TEXT;
  entry_title TEXT;
BEGIN
  IF NEW.requires_approval = true AND NEW.approval_status = 'pending' THEN
    SELECT display_name INTO rn_name FROM public.profiles WHERE user_id = NEW.rn_id;
    
    -- Notify supervisors (using valid roles: STAFF and SUPER_ADMIN)
    INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
    SELECT 
      ur.user_id,
      'Diary Entry Requires Approval',
      rn_name || ' created a ' || NEW.entry_type || ' entry that needs approval: ' || NEW.title,
      'warning',
      '/rn-diary?entry=' || NEW.id::text,
      jsonb_build_object('entry_id', NEW.id, 'rn_id', NEW.rn_id, 'entry_type', NEW.entry_type)
    FROM public.user_roles ur
    WHERE ur.role IN ('STAFF', 'SUPER_ADMIN');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for supervisor notification
DROP TRIGGER IF EXISTS notify_approval_needed_trigger ON public.rn_diary_entries;
CREATE TRIGGER notify_approval_needed_trigger
AFTER INSERT OR UPDATE OF approval_status ON public.rn_diary_entries
FOR EACH ROW
EXECUTE FUNCTION public.notify_supervisor_for_approval();

-- Function to auto-update entry status based on dependencies
CREATE OR REPLACE FUNCTION public.check_entry_dependencies()
RETURNS TRIGGER AS $$
DECLARE
  has_blocking_incomplete BOOLEAN;
BEGIN
  -- Check if any blocking dependencies are incomplete
  SELECT EXISTS (
    SELECT 1 
    FROM public.rn_diary_entry_dependencies dep
    JOIN public.rn_diary_entries blocked_entry ON blocked_entry.id = dep.depends_on_entry_id
    WHERE dep.entry_id = NEW.id 
    AND dep.dependency_type = 'blocks'
    AND blocked_entry.completion_status NOT IN ('completed', 'cancelled')
  ) INTO has_blocking_incomplete;
  
  -- If blocking dependencies exist and are incomplete, mark as blocked
  IF has_blocking_incomplete AND NEW.completion_status = 'pending' THEN
    NEW.completion_status := 'blocked';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for dependency checks
DROP TRIGGER IF EXISTS check_dependencies_trigger ON public.rn_diary_entries;
CREATE TRIGGER check_dependencies_trigger
BEFORE INSERT OR UPDATE ON public.rn_diary_entries
FOR EACH ROW
EXECUTE FUNCTION public.check_entry_dependencies();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_diary_entries_label ON public.rn_diary_entries(label);
CREATE INDEX IF NOT EXISTS idx_diary_entries_approval_status ON public.rn_diary_entries(approval_status) WHERE approval_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_diary_dependencies_entry ON public.rn_diary_entry_dependencies(entry_id);
CREATE INDEX IF NOT EXISTS idx_diary_dependencies_depends_on ON public.rn_diary_entry_dependencies(depends_on_entry_id);