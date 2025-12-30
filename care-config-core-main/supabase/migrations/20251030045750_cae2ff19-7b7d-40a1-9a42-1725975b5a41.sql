-- Add audit logging trigger for reports

-- Drop and recreate the logging function
DROP FUNCTION IF EXISTS log_report_action() CASCADE;

CREATE OR REPLACE FUNCTION log_report_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when report is marked as read
  IF OLD.review_status = 'pending' AND NEW.review_status = 'read' THEN
    INSERT INTO audit_logs (actor_id, actor_role, action, case_id, meta)
    VALUES (
      NEW.reviewed_by,
      'ATTORNEY',
      'report_reviewed',
      NEW.case_id,
      jsonb_build_object(
        'report_id', NEW.id,
        'report_title', NEW.report_title,
        'reviewed_at', NEW.reviewed_at
      )
    );
  END IF;

  -- Log when report is filed
  IF OLD.filed_status = 'unfiled' AND NEW.filed_status = 'filed' THEN
    INSERT INTO audit_logs (actor_id, actor_role, action, case_id, meta)
    VALUES (
      NEW.filed_by,
      'ATTORNEY',
      'report_filed',
      NEW.case_id,
      jsonb_build_object(
        'report_id', NEW.id,
        'report_title', NEW.report_title,
        'filed_at', NEW.filed_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS report_action_logger ON public.report_documents;
CREATE TRIGGER report_action_logger
AFTER UPDATE ON public.report_documents
FOR EACH ROW
EXECUTE FUNCTION log_report_action();