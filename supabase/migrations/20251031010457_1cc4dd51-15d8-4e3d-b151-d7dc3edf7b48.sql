-- Add new columns to documents table for enhanced features
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS is_sensitive BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS note TEXT,
  ADD COLUMN IF NOT EXISTS shared_with UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS activity_log JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mirror_to_case_notes BOOLEAN DEFAULT TRUE;

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_sensitive ON documents(is_sensitive);

-- Create document_activity_log table for detailed tracking
CREATE TABLE IF NOT EXISTS document_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'viewed', 'downloaded', 'shared', 'marked_sensitive', 'filed_to_case'
  performed_by UUID NOT NULL,
  performed_by_name TEXT,
  performed_by_role TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policies for document_activity_log
ALTER TABLE document_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity for their case documents"
ON document_activity_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM documents d
    JOIN case_assignments ca ON ca.case_id = d.case_id
    WHERE d.id = document_activity_log.document_id
      AND ca.user_id = auth.uid()
  )
  OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
);

CREATE POLICY "Users can insert activity for their case documents"
ON document_activity_log FOR INSERT
WITH CHECK (
  performed_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM documents d
    JOIN case_assignments ca ON ca.case_id = d.case_id
    WHERE d.id = document_activity_log.document_id
      AND ca.user_id = auth.uid()
  )
);

-- Create function to log document activity
CREATE OR REPLACE FUNCTION log_document_activity(
  p_document_id UUID,
  p_action_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_name TEXT;
  v_user_role TEXT;
BEGIN
  v_user_id := auth.uid();
  
  -- Get user name and role
  SELECT display_name INTO v_user_name FROM profiles WHERE user_id = v_user_id;
  SELECT role::text INTO v_user_role FROM user_roles WHERE user_id = v_user_id LIMIT 1;
  
  INSERT INTO document_activity_log (
    document_id,
    action_type,
    performed_by,
    performed_by_name,
    performed_by_role,
    metadata
  ) VALUES (
    p_document_id,
    p_action_type,
    v_user_id,
    COALESCE(v_user_name, 'Unknown'),
    COALESCE(v_user_role, 'UNKNOWN'),
    p_metadata
  );
END;
$$;

-- Create function to send sensitive document notifications
CREATE OR REPLACE FUNCTION notify_sensitive_document()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case_id TEXT;
  v_doc_name TEXT;
BEGIN
  -- Only trigger on updates where is_sensitive changed to true
  IF NEW.is_sensitive = TRUE AND (OLD.is_sensitive IS FALSE OR OLD.is_sensitive IS NULL) THEN
    v_case_id := 'RC-' || RIGHT(NEW.case_id::text, 8);
    v_doc_name := NEW.file_name;
    
    -- Notify RN CM assigned to the case
    PERFORM notify_roles(
      ARRAY['RN_CCM', 'RN_CCM_DIRECTOR', 'COMPLIANCE_DIRECTOR']::text[],
      'Sensitive Document Marked',
      'Document "' || v_doc_name || '" in Case ' || v_case_id || ' has been marked as sensitive',
      'warning',
      '/documents?doc=' || NEW.id::text,
      jsonb_build_object('document_id', NEW.id, 'case_id', NEW.case_id)
    );
    
    -- Log the activity
    PERFORM log_document_activity(
      NEW.id,
      'marked_sensitive',
      jsonb_build_object('case_id', v_case_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for sensitive document notifications
DROP TRIGGER IF EXISTS on_document_marked_sensitive ON documents;
CREATE TRIGGER on_document_marked_sensitive
  AFTER UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION notify_sensitive_document();

-- Add audit log entry for document uploads
CREATE OR REPLACE FUNCTION audit_document_upload()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (actor_id, actor_role, action, case_id, meta)
  SELECT 
    NEW.uploaded_by,
    ur.role::text,
    'document_uploaded',
    NEW.case_id,
    jsonb_build_object(
      'document_id', NEW.id,
      'file_name', NEW.file_name,
      'document_type', NEW.document_type,
      'category', NEW.category,
      'is_sensitive', NEW.is_sensitive
    )
  FROM user_roles ur
  WHERE ur.user_id = NEW.uploaded_by
  LIMIT 1;
  
  RETURN NEW;
END;
$$;

-- Create trigger for audit logging on document upload
DROP TRIGGER IF EXISTS on_document_upload_audit ON documents;
CREATE TRIGGER on_document_upload_audit
  AFTER INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION audit_document_upload();