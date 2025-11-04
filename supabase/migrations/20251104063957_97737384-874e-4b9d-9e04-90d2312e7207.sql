-- Add approval and audit fields to rn_time_entries
ALTER TABLE rn_time_entries
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS submitted_for_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Create audit log table for time entry changes
CREATE TABLE IF NOT EXISTS rn_time_entry_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id UUID NOT NULL REFERENCES rn_time_entries(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'approved', 'rejected')),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE rn_time_entry_audit ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit table
CREATE POLICY "RN CMs can view their own audit logs"
ON rn_time_entry_audit FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM rn_time_entries
    WHERE rn_time_entries.id = rn_time_entry_audit.time_entry_id
    AND rn_time_entries.rn_user_id = auth.uid()
  )
);

CREATE POLICY "Supervisors can view all audit logs"
ON rn_time_entry_audit FOR SELECT
USING (
  has_role('RN_SUPERVISOR'::text) OR has_role('SUPER_USER'::text) OR has_role('SUPER_ADMIN'::text)
);

CREATE POLICY "System can insert audit logs"
ON rn_time_entry_audit FOR INSERT
WITH CHECK (true);

-- Update RLS policies for time entries to allow supervisors to approve
CREATE POLICY "Supervisors can update time entries for approval"
ON rn_time_entries FOR UPDATE
USING (
  has_role('RN_SUPERVISOR'::text) OR has_role('SUPER_USER'::text) OR has_role('SUPER_ADMIN'::text)
);

-- Create function to automatically log time entry changes
CREATE OR REPLACE FUNCTION log_time_entry_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Log specific field changes
    IF OLD.activity_type != NEW.activity_type THEN
      INSERT INTO rn_time_entry_audit (time_entry_id, changed_by, action, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'updated', 'activity_type', OLD.activity_type, NEW.activity_type);
    END IF;
    
    IF OLD.time_spent_minutes != NEW.time_spent_minutes THEN
      INSERT INTO rn_time_entry_audit (time_entry_id, changed_by, action, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'updated', 'time_spent_minutes', OLD.time_spent_minutes::text, NEW.time_spent_minutes::text);
    END IF;
    
    IF OLD.activity_description != NEW.activity_description OR (OLD.activity_description IS NULL AND NEW.activity_description IS NOT NULL) OR (OLD.activity_description IS NOT NULL AND NEW.activity_description IS NULL) THEN
      INSERT INTO rn_time_entry_audit (time_entry_id, changed_by, action, field_changed, old_value, new_value)
      VALUES (NEW.id, auth.uid(), 'updated', 'activity_description', OLD.activity_description, NEW.activity_description);
    END IF;
    
    IF OLD.approval_status != NEW.approval_status THEN
      INSERT INTO rn_time_entry_audit (time_entry_id, changed_by, action, field_changed, old_value, new_value, change_reason)
      VALUES (NEW.id, auth.uid(), NEW.approval_status, 'approval_status', OLD.approval_status, NEW.approval_status, NEW.rejection_reason);
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO rn_time_entry_audit (time_entry_id, changed_by, action)
    VALUES (NEW.id, auth.uid(), 'created');
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO rn_time_entry_audit (time_entry_id, changed_by, action)
    VALUES (OLD.id, auth.uid(), 'deleted');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS time_entry_audit_trigger ON rn_time_entries;
CREATE TRIGGER time_entry_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON rn_time_entries
FOR EACH ROW
EXECUTE FUNCTION log_time_entry_change();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_time_entries_approval_status ON rn_time_entries(approval_status);
CREATE INDEX IF NOT EXISTS idx_time_entries_submitted ON rn_time_entries(submitted_for_approval, submitted_at);
CREATE INDEX IF NOT EXISTS idx_audit_time_entry ON rn_time_entry_audit(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON rn_time_entry_audit(changed_at DESC);