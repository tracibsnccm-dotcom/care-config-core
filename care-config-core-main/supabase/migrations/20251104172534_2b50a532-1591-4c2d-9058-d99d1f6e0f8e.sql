-- Add diary entry audit log table
CREATE TABLE IF NOT EXISTS public.rn_diary_entry_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.rn_diary_entries(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add quick comments table
CREATE TABLE IF NOT EXISTS public.rn_diary_entry_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.rn_diary_entries(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rn_diary_entry_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rn_diary_entry_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit log (read-only for RN CMs and supervisors)
CREATE POLICY "RN CMs can view their entry audit logs"
  ON public.rn_diary_entry_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rn_diary_entries rde
      WHERE rde.id = entry_id 
      AND rde.rn_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_USER', 'SUPER_ADMIN', 'RN_CCM')
    )
  );

-- RLS Policies for comments
CREATE POLICY "RN CMs can view comments on their entries"
  ON public.rn_diary_entry_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.rn_diary_entries rde
      WHERE rde.id = entry_id 
      AND rde.rn_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('SUPER_USER', 'SUPER_ADMIN', 'RN_CCM')
    )
  );

CREATE POLICY "RN CMs can create comments on their entries"
  ON public.rn_diary_entry_comments FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      EXISTS (
        SELECT 1 FROM public.rn_diary_entries rde
        WHERE rde.id = entry_id 
        AND rde.rn_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role IN ('SUPER_USER', 'SUPER_ADMIN', 'RN_CCM')
      )
    )
  );

-- Function to log diary entry changes
CREATE OR REPLACE FUNCTION public.log_diary_entry_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log scheduled date changes
    IF OLD.scheduled_date != NEW.scheduled_date OR (OLD.scheduled_time IS DISTINCT FROM NEW.scheduled_time) THEN
      INSERT INTO rn_diary_entry_audit (entry_id, changed_by, action, field_changed, old_value, new_value)
      VALUES (
        NEW.id, 
        auth.uid(), 
        'rescheduled', 
        'scheduled_date_time',
        OLD.scheduled_date || ' ' || COALESCE(OLD.scheduled_time::TEXT, ''),
        NEW.scheduled_date || ' ' || COALESCE(NEW.scheduled_time::TEXT, '')
      );
    END IF;
    
    -- Log status changes
    IF OLD.completion_status IS DISTINCT FROM NEW.completion_status THEN
      INSERT INTO rn_diary_entry_audit (entry_id, changed_by, action, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'status_changed', 'completion_status', OLD.completion_status, NEW.completion_status);
    END IF;
    
    -- Log reassignments
    IF OLD.rn_id != NEW.rn_id THEN
      INSERT INTO rn_diary_entry_audit (entry_id, changed_by, action, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'reassigned', 'rn_id', OLD.rn_id::TEXT, NEW.rn_id::TEXT);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO rn_diary_entry_audit (entry_id, changed_by, action)
    VALUES (NEW.id, auth.uid(), 'created');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO rn_diary_entry_audit (entry_id, changed_by, action)
    VALUES (OLD.id, auth.uid(), 'deleted');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for diary entry changes
DROP TRIGGER IF EXISTS diary_entry_audit_trigger ON public.rn_diary_entries;
CREATE TRIGGER diary_entry_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.rn_diary_entries
FOR EACH ROW EXECUTE FUNCTION public.log_diary_entry_change();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_diary_audit_entry_id ON public.rn_diary_entry_audit(entry_id);
CREATE INDEX IF NOT EXISTS idx_diary_audit_created_at ON public.rn_diary_entry_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_comments_entry_id ON public.rn_diary_entry_comments(entry_id);
CREATE INDEX IF NOT EXISTS idx_diary_comments_created_at ON public.rn_diary_entry_comments(created_at DESC);