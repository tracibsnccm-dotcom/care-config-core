-- Create helper function to get current time (simulated or real)
CREATE OR REPLACE FUNCTION get_current_time()
RETURNS timestamptz AS $$
DECLARE
  sim_time timestamptz;
  is_active boolean;
BEGIN
  -- Check if simulated time is active
  SELECT simulated_timestamp, is_active INTO sim_time, is_active
  FROM simulated_time
  WHERE id = 1;
  
  -- Return simulated time if active, otherwise return now()
  IF is_active AND sim_time IS NOT NULL THEN
    RETURN sim_time;
  ELSE
    RETURN now();
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update default timestamp columns to use get_current_time()
-- This affects new inserts going forward

-- Update audit_events
ALTER TABLE audit_events ALTER COLUMN created_at SET DEFAULT get_current_time();

-- Update care_plan_reminders
ALTER TABLE care_plan_reminders ALTER COLUMN created_at SET DEFAULT get_current_time();
ALTER TABLE care_plan_reminders ALTER COLUMN updated_at SET DEFAULT get_current_time();

-- Update case_notes
ALTER TABLE case_notes ALTER COLUMN created_at SET DEFAULT get_current_time();
ALTER TABLE case_notes ALTER COLUMN updated_at SET DEFAULT get_current_time();

-- Update case_tasks
ALTER TABLE case_tasks ALTER COLUMN created_at SET DEFAULT get_current_time();
ALTER TABLE case_tasks ALTER COLUMN updated_at SET DEFAULT get_current_time();

-- Update rn_diary_entries
ALTER TABLE rn_diary_entries ALTER COLUMN created_at SET DEFAULT get_current_time();
ALTER TABLE rn_diary_entries ALTER COLUMN updated_at SET DEFAULT get_current_time();

-- Update rn_time_entries
ALTER TABLE rn_time_entries ALTER COLUMN created_at SET DEFAULT get_current_time();

-- Create function to check for overdue tasks
CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS TABLE(task_id uuid, case_id uuid, title text, due_date date, days_overdue integer) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id as task_id,
    ct.case_id,
    ct.title,
    ct.due_date,
    (DATE(get_current_time()) - ct.due_date)::integer as days_overdue
  FROM case_tasks ct
  WHERE ct.status != 'completed'
    AND ct.due_date < DATE(get_current_time())
  ORDER BY ct.due_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to check for upcoming reminders
CREATE OR REPLACE FUNCTION check_upcoming_reminders(days_ahead integer DEFAULT 7)
RETURNS TABLE(
  reminder_id uuid,
  case_id uuid,
  rn_id uuid,
  title text,
  reminder_date date,
  days_until integer,
  priority text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cpr.id as reminder_id,
    cpr.case_id,
    cpr.rn_id,
    cpr.title,
    cpr.reminder_date,
    (cpr.reminder_date - DATE(get_current_time()))::integer as days_until,
    cpr.priority
  FROM care_plan_reminders cpr
  WHERE cpr.status = 'pending'
    AND cpr.reminder_date BETWEEN DATE(get_current_time()) 
    AND DATE(get_current_time()) + days_ahead
  ORDER BY cpr.reminder_date ASC, cpr.priority DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create function to check for expiring documents/authorizations
CREATE OR REPLACE FUNCTION check_expiring_items(days_ahead integer DEFAULT 30)
RETURNS TABLE(
  item_type text,
  item_id uuid,
  case_id uuid,
  expires_at timestamptz,
  days_until_expiry integer
) AS $$
BEGIN
  RETURN QUERY
  -- Check assignment offers
  SELECT 
    'assignment_offer'::text as item_type,
    ao.id as item_id,
    ao.case_id,
    ao.expires_at,
    EXTRACT(EPOCH FROM (ao.expires_at - get_current_time()))::integer / 86400 as days_until_expiry
  FROM assignment_offers ao
  WHERE ao.status = 'pending'
    AND ao.expires_at BETWEEN get_current_time() 
    AND get_current_time() + (days_ahead || ' days')::interval
  ORDER BY ao.expires_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update triggers to use get_current_time()
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = get_current_time();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;