-- Add timeline tracking table for concerns and complaints
CREATE TABLE IF NOT EXISTS public.concern_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  concern_id uuid NOT NULL REFERENCES public.concerns(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  status text NOT NULL,
  performed_by uuid,
  performed_by_role text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.complaint_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  status text NOT NULL,
  performed_by uuid,
  performed_by_role text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.concern_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_timeline ENABLE ROW LEVEL SECURITY;

-- RLS policies for concern timeline
CREATE POLICY "Directors and compliance can view concern timeline"
ON public.concern_timeline
FOR SELECT
USING (
  has_role('RN_CCM_DIRECTOR'::text) OR 
  has_role('COMPLIANCE_DIRECTOR'::text) OR 
  has_role('COMPLIANCE'::text) OR 
  has_role('SUPER_ADMIN'::text) OR 
  has_role('SUPER_USER'::text)
);

CREATE POLICY "System can insert concern timeline"
ON public.concern_timeline
FOR INSERT
WITH CHECK (true);

-- RLS policies for complaint timeline
CREATE POLICY "Directors and compliance can view complaint timeline"
ON public.complaint_timeline
FOR SELECT
USING (
  has_role('RN_CCM_DIRECTOR'::text) OR 
  has_role('COMPLIANCE_DIRECTOR'::text) OR 
  has_role('COMPLIANCE'::text) OR 
  has_role('SUPER_ADMIN'::text) OR 
  has_role('SUPER_USER'::text)
);

CREATE POLICY "System can insert complaint timeline"
ON public.complaint_timeline
FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_concern_timeline_concern ON public.concern_timeline(concern_id, created_at DESC);
CREATE INDEX idx_complaint_timeline_complaint ON public.complaint_timeline(complaint_id, created_at DESC);

-- Update concerns table to add status_changed_at
ALTER TABLE public.concerns ADD COLUMN IF NOT EXISTS status_changed_at timestamp with time zone DEFAULT now();
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS status_changed_at timestamp with time zone DEFAULT now();
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;
ALTER TABLE public.concerns ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone;

-- Function to add timeline entry for concerns
CREATE OR REPLACE FUNCTION public.add_concern_timeline_entry(
  p_concern_id uuid,
  p_event_type text,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user's primary role
  SELECT role::text INTO v_user_role
  FROM user_roles
  WHERE user_id = v_user_id
  LIMIT 1;
  
  INSERT INTO public.concern_timeline (
    concern_id,
    event_type,
    status,
    performed_by,
    performed_by_role,
    notes
  ) VALUES (
    p_concern_id,
    p_event_type,
    p_status,
    v_user_id,
    v_user_role,
    p_notes
  );
END;
$$;

-- Function to add timeline entry for complaints
CREATE OR REPLACE FUNCTION public.add_complaint_timeline_entry(
  p_complaint_id uuid,
  p_event_type text,
  p_status text,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_role text;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user's primary role
  SELECT role::text INTO v_user_role
  FROM user_roles
  WHERE user_id = v_user_id
  LIMIT 1;
  
  INSERT INTO public.complaint_timeline (
    complaint_id,
    event_type,
    status,
    performed_by,
    performed_by_role,
    notes
  ) VALUES (
    p_complaint_id,
    p_event_type,
    p_status,
    v_user_id,
    v_user_role,
    p_notes
  );
END;
$$;

-- Enhanced trigger for concern creation with timeline
CREATE OR REPLACE FUNCTION public.on_concern_created_with_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_initials text;
  short_case_id text;
BEGIN
  client_initials := get_client_initials(NEW.client_id);
  short_case_id := get_short_case_id(NEW.case_id);
  
  -- Add timeline entry
  INSERT INTO public.concern_timeline (
    concern_id,
    event_type,
    status,
    performed_by,
    performed_by_role,
    notes
  ) VALUES (
    NEW.id,
    'Submitted',
    'New',
    NEW.client_id,
    'CLIENT',
    'Concern submitted by client'
  );
  
  -- Send notifications
  PERFORM notify_roles(
    ARRAY['RN_CCM_DIRECTOR', 'COMPLIANCE_DIRECTOR', 'COMPLIANCE', 'SUPER_ADMIN']::text[],
    'New Client Concern Submitted',
    'Client ' || client_initials || ' (Case #' || short_case_id || ') submitted a concern',
    'warning',
    '/concerns-complaints?tab=concerns&id=' || NEW.id::text,
    jsonb_build_object('concern_id', NEW.id, 'case_id', NEW.case_id)
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_concern_created ON public.concerns;
CREATE TRIGGER trigger_concern_created
AFTER INSERT ON public.concerns
FOR EACH ROW
EXECUTE FUNCTION on_concern_created_with_timeline();

-- Enhanced trigger for complaint creation with timeline
CREATE OR REPLACE FUNCTION public.on_complaint_created_with_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Add timeline entry
  INSERT INTO public.complaint_timeline (
    complaint_id,
    event_type,
    status,
    performed_by,
    notes
  ) VALUES (
    NEW.id,
    'Submitted',
    'new',
    NULL,
    'Anonymous complaint submitted'
  );
  
  -- Send notifications
  PERFORM notify_roles(
    ARRAY['RN_CCM_DIRECTOR', 'COMPLIANCE_DIRECTOR', 'COMPLIANCE', 'SUPER_ADMIN']::text[],
    'New Anonymous Complaint Received',
    'Anonymous complaint filed regarding ' || NEW.complaint_about,
    'warning',
    '/concerns-complaints?tab=complaints&id=' || NEW.id::text,
    jsonb_build_object('complaint_id', NEW.id)
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_complaint_created ON public.complaints;
CREATE TRIGGER trigger_complaint_created
AFTER INSERT ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION on_complaint_created_with_timeline();

-- Enhanced concern update trigger with timeline and status tracking
CREATE OR REPLACE FUNCTION public.on_concern_updated_with_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_initials text;
  short_case_id text;
  assignee_name text;
BEGIN
  client_initials := get_client_initials(NEW.client_id);
  short_case_id := get_short_case_id(NEW.case_id);
  
  -- Update status_changed_at if status changed
  IF OLD.concern_status IS DISTINCT FROM NEW.concern_status THEN
    NEW.status_changed_at := now();
  END IF;
  
  -- concern.acknowledged
  IF OLD.concern_status != 'Under Review' AND NEW.concern_status = 'Under Review' THEN
    PERFORM add_concern_timeline_entry(NEW.id, 'Acknowledged', 'Acknowledged', 'Concern acknowledged by compliance');
    
    IF auth.uid() IS NOT NULL THEN
      PERFORM notify_user(
        auth.uid(),
        'Concern Acknowledged',
        'You acknowledged concern for Client ' || client_initials || ' (Case #' || short_case_id || ')',
        'info',
        '/concerns-complaints?tab=concerns&id=' || NEW.id::text
      );
    END IF;
  END IF;
  
  -- concern.assigned
  IF (OLD.assigned_rn IS NULL AND NEW.assigned_rn IS NOT NULL) OR (OLD.assigned_rn IS DISTINCT FROM NEW.assigned_rn AND NEW.assigned_rn IS NOT NULL) THEN
    SELECT display_name INTO assignee_name FROM profiles WHERE user_id = NEW.assigned_rn;
    
    PERFORM add_concern_timeline_entry(
      NEW.id, 
      'Assigned', 
      'Assigned', 
      'Assigned to ' || COALESCE(assignee_name, 'RN')
    );
    
    PERFORM notify_user(
      NEW.assigned_rn,
      'Concern Assigned to You',
      'You have been assigned to follow up on concern for Client ' || client_initials || ' (Case #' || short_case_id || ')',
      'info',
      '/concerns-complaints?tab=concerns&id=' || NEW.id::text
    );
    
    -- Notify prior assignee if reassignment
    IF OLD.assigned_rn IS NOT NULL AND OLD.assigned_rn != NEW.assigned_rn THEN
      PERFORM notify_user(
        OLD.assigned_rn,
        'Concern Reassigned',
        'Concern for Client ' || client_initials || ' (Case #' || short_case_id || ') has been reassigned',
        'info',
        '/concerns-complaints?tab=concerns&id=' || NEW.id::text
      );
    END IF;
  END IF;
  
  -- concern.rn_followup_logged
  IF (OLD.rn_followup_notes IS NULL OR OLD.rn_followup_notes = '') AND NEW.rn_followup_notes IS NOT NULL AND NEW.rn_followup_notes != '' THEN
    PERFORM add_concern_timeline_entry(NEW.id, 'Follow-Up Logged', 'Follow-Up Logged', 'RN follow-up documented');
    
    PERFORM notify_roles(
      ARRAY['RN_CCM_DIRECTOR', 'COMPLIANCE_DIRECTOR', 'COMPLIANCE', 'SUPER_ADMIN']::text[],
      'RN Follow-Up Logged',
      'RN logged follow-up for Client ' || client_initials || ' concern (Case #' || short_case_id || ')',
      'info',
      '/concerns-complaints?tab=concerns&id=' || NEW.id::text
    );
  END IF;
  
  -- concern.resolved
  IF OLD.concern_status != 'Resolved' AND NEW.concern_status = 'Resolved' THEN
    PERFORM add_concern_timeline_entry(NEW.id, 'Resolved', 'Resolved', 'Concern marked as resolved');
    
    PERFORM notify_roles(
      ARRAY['RN_CCM_DIRECTOR', 'COMPLIANCE_DIRECTOR', 'COMPLIANCE', 'SUPER_ADMIN']::text[],
      'Concern Resolved',
      'Concern for Client ' || client_initials || ' (Case #' || short_case_id || ') has been resolved',
      'success',
      '/concerns-complaints?tab=concerns&id=' || NEW.id::text
    );
    
    PERFORM notify_user(
      NEW.client_id,
      'Your Concern Has Been Resolved',
      'Your concern from ' || to_char(NEW.created_at, 'Mon DD, YYYY') || ' has been resolved',
      'success',
      '/client-portal'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_concern_updated ON public.concerns;
CREATE TRIGGER trigger_concern_updated
AFTER UPDATE ON public.concerns
FOR EACH ROW
EXECUTE FUNCTION on_concern_updated_with_timeline();

-- Enhanced complaint resolution trigger with timeline
CREATE OR REPLACE FUNCTION public.on_complaint_resolved_with_timeline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update status_changed_at if status changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.status_changed_at := now();
  END IF;
  
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
    PERFORM add_complaint_timeline_entry(NEW.id, 'Resolved', 'resolved', 'Complaint marked as resolved');
    
    PERFORM notify_roles(
      ARRAY['RN_CCM_DIRECTOR', 'COMPLIANCE_DIRECTOR', 'COMPLIANCE', 'SUPER_ADMIN']::text[],
      'Complaint Resolved',
      'Anonymous complaint regarding ' || NEW.complaint_about || ' has been resolved',
      'success',
      '/concerns-complaints?tab=complaints&id=' || NEW.id::text
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_complaint_resolved ON public.complaints;
CREATE TRIGGER trigger_complaint_resolved
BEFORE UPDATE ON public.complaints
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION on_complaint_resolved_with_timeline();

-- Enable realtime for timeline tables
ALTER TABLE public.concern_timeline REPLICA IDENTITY FULL;
ALTER TABLE public.complaint_timeline REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.concern_timeline;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_timeline;