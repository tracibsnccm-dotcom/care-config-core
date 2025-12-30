-- Create notifications table for in-app messaging
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  link text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX idx_concerns_status_created ON public.concerns(concern_status, created_at);
CREATE INDEX idx_complaints_status_created ON public.complaints(status, created_at);

-- Helper function to get client initials (HIPAA-safe)
CREATE OR REPLACE FUNCTION public.get_client_initials(client_uuid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  client_name text;
  initials text;
BEGIN
  SELECT display_name INTO client_name FROM profiles WHERE user_id = client_uuid;
  
  IF client_name IS NULL THEN
    RETURN 'N/A';
  END IF;
  
  -- Get first initial only
  initials := UPPER(LEFT(client_name, 1));
  RETURN initials || '.';
END;
$$;

-- Helper function to get short case ID (last 8 chars)
CREATE OR REPLACE FUNCTION public.get_short_case_id(case_uuid uuid)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN RIGHT(case_uuid::text, 8);
END;
$$;

-- Function to send notification to specific roles
CREATE OR REPLACE FUNCTION public.notify_roles(
  role_names text[],
  notification_title text,
  notification_message text,
  notification_type text DEFAULT 'info',
  notification_link text DEFAULT NULL,
  notification_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
  SELECT DISTINCT ur.user_id, notification_title, notification_message, notification_type, notification_link, notification_metadata
  FROM user_roles ur
  WHERE ur.role::text = ANY(role_names);
END;
$$;

-- Function to send notification to specific user
CREATE OR REPLACE FUNCTION public.notify_user(
  target_user_id uuid,
  notification_title text,
  notification_message text,
  notification_type text DEFAULT 'info',
  notification_link text DEFAULT NULL,
  notification_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
  VALUES (target_user_id, notification_title, notification_message, notification_type, notification_link, notification_metadata);
END;
$$;

-- Trigger: concern.created
CREATE OR REPLACE FUNCTION public.on_concern_created()
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

CREATE TRIGGER trigger_concern_created
AFTER INSERT ON public.concerns
FOR EACH ROW
EXECUTE FUNCTION on_concern_created();

-- Trigger: complaint.created
CREATE OR REPLACE FUNCTION public.on_complaint_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

CREATE TRIGGER trigger_complaint_created
AFTER INSERT ON public.complaints
FOR EACH ROW
EXECUTE FUNCTION on_complaint_created();

-- Trigger: concern status changes (acknowledged, assigned, resolved)
CREATE OR REPLACE FUNCTION public.on_concern_updated()
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
  
  -- concern.acknowledged (notify director who acknowledged)
  IF OLD.concern_status != 'Under Review' AND NEW.concern_status = 'Under Review' THEN
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
  
  -- concern.assigned (notify RN assignee)
  IF (OLD.assigned_rn IS NULL AND NEW.assigned_rn IS NOT NULL) OR (OLD.assigned_rn != NEW.assigned_rn AND NEW.assigned_rn IS NOT NULL) THEN
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
    -- Notify compliance directors
    PERFORM notify_roles(
      ARRAY['RN_CCM_DIRECTOR', 'COMPLIANCE_DIRECTOR', 'COMPLIANCE', 'SUPER_ADMIN']::text[],
      'Concern Resolved',
      'Concern for Client ' || client_initials || ' (Case #' || short_case_id || ') has been resolved',
      'success',
      '/concerns-complaints?tab=concerns&id=' || NEW.id::text
    );
    
    -- Notify client
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

CREATE TRIGGER trigger_concern_updated
AFTER UPDATE ON public.concerns
FOR EACH ROW
EXECUTE FUNCTION on_concern_updated();

-- Trigger: complaint.resolved
CREATE OR REPLACE FUNCTION public.on_complaint_resolved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status != 'resolved' AND NEW.status = 'resolved' THEN
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

CREATE TRIGGER trigger_complaint_resolved
AFTER UPDATE ON public.complaints
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION on_complaint_resolved();

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;