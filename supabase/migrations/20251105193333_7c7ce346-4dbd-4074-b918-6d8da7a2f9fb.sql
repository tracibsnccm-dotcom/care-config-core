-- Add Manager and Supervisor roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'RN_CM_SUPERVISOR';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'RN_CM_MANAGER';

-- Create case reassignments table for tracking
CREATE TABLE IF NOT EXISTS public.case_reassignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  from_rn_id UUID NOT NULL,
  to_rn_id UUID NOT NULL,
  reassigned_by UUID NOT NULL,
  reassigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.case_reassignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_reassignments
CREATE POLICY "RN CMs can create reassignments for their cases"
ON public.case_reassignments
FOR INSERT
WITH CHECK (
  reassigned_by = auth.uid() AND
  (has_role('RN_CCM') OR has_role('RN_CM_SUPERVISOR') OR has_role('RN_CM_MANAGER') OR has_role('RN_CM_DIRECTOR'))
);

CREATE POLICY "Users can view reassignments for their cases"
ON public.case_reassignments
FOR SELECT
USING (
  from_rn_id = auth.uid() OR 
  to_rn_id = auth.uid() OR 
  reassigned_by = auth.uid() OR
  has_role('RN_CM_SUPERVISOR') OR 
  has_role('RN_CM_MANAGER') OR 
  has_role('RN_CM_DIRECTOR') OR
  has_role('SUPER_ADMIN')
);

-- Create function to auto-log case reassignment
CREATE OR REPLACE FUNCTION public.log_case_reassignment()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_reassigner_name TEXT;
  v_from_rn_name TEXT;
  v_to_rn_name TEXT;
  v_log_message TEXT;
BEGIN
  -- Get names from profiles
  SELECT display_name INTO v_reassigner_name FROM profiles WHERE user_id = NEW.reassigned_by;
  SELECT display_name INTO v_from_rn_name FROM profiles WHERE user_id = NEW.from_rn_id;
  SELECT display_name INTO v_to_rn_name FROM profiles WHERE user_id = NEW.to_rn_id;

  -- Create log message
  v_log_message := format(
    'Case reassigned from %s to %s by %s on %s',
    COALESCE(v_from_rn_name, 'Unknown'),
    COALESCE(v_to_rn_name, 'Unknown'),
    COALESCE(v_reassigner_name, 'Unknown'),
    to_char(NEW.reassigned_at, 'MM/DD/YYYY at HH12:MI AM')
  );

  -- Insert audit event
  INSERT INTO public.audit_events (
    case_id,
    event_type,
    actor_user_id,
    event_meta,
    created_at
  ) VALUES (
    NEW.case_id,
    'case_reassignment',
    NEW.reassigned_by,
    jsonb_build_object(
      'from_rn_id', NEW.from_rn_id,
      'to_rn_id', NEW.to_rn_id,
      'reason', NEW.reason,
      'notes', NEW.notes,
      'log_message', v_log_message
    ),
    NEW.reassigned_at
  );

  RETURN NEW;
END;
$$;

-- Create trigger for auto-logging
CREATE TRIGGER trigger_log_case_reassignment
AFTER INSERT ON public.case_reassignments
FOR EACH ROW
EXECUTE FUNCTION public.log_case_reassignment();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_case_reassignments_case_id ON public.case_reassignments(case_id);
CREATE INDEX IF NOT EXISTS idx_case_reassignments_from_rn ON public.case_reassignments(from_rn_id);
CREATE INDEX IF NOT EXISTS idx_case_reassignments_to_rn ON public.case_reassignments(to_rn_id);
CREATE INDEX IF NOT EXISTS idx_case_reassignments_reassigned_by ON public.case_reassignments(reassigned_by);