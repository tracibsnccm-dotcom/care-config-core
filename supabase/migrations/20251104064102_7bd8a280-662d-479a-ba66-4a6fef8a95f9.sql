-- Fix search_path for log_time_entry_change function
CREATE OR REPLACE FUNCTION log_time_entry_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;