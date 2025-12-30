-- Create report_documents table for attorney report tracking
CREATE TABLE public.report_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  report_title text NOT NULL,
  report_type text NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  generated_by uuid,
  file_path text,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'read')),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  filed_status text NOT NULL DEFAULT 'unfiled' CHECK (filed_status IN ('unfiled', 'filed')),
  filed_by uuid,
  filed_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view reports for their assigned cases"
ON public.report_documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = report_documents.case_id 
    AND ca.user_id = auth.uid()
  )
  OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

CREATE POLICY "Staff can create reports"
ON public.report_documents
FOR INSERT
WITH CHECK (
  has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF') 
  OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

CREATE POLICY "Attorneys can update report status"
ON public.report_documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = report_documents.case_id 
    AND ca.user_id = auth.uid()
  )
  OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

-- Create indexes
CREATE INDEX idx_report_documents_case_id ON public.report_documents(case_id);
CREATE INDEX idx_report_documents_review_status ON public.report_documents(review_status);
CREATE INDEX idx_report_documents_filed_status ON public.report_documents(filed_status);
CREATE INDEX idx_report_documents_generated_at ON public.report_documents(generated_at DESC);

-- Function to log report actions
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
CREATE TRIGGER report_action_logger
AFTER UPDATE ON public.report_documents
FOR EACH ROW
EXECUTE FUNCTION log_report_action();

-- Enable realtime for report_documents
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_documents;