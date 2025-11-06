-- Fix search_path for newly created functions
CREATE OR REPLACE FUNCTION get_current_time()
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
DECLARE
  sim_time timestamptz;
  is_active boolean;
BEGIN
  SELECT simulated_timestamp, is_active INTO sim_time, is_active
  FROM simulated_time
  WHERE id = 1;
  
  IF is_active AND sim_time IS NOT NULL THEN
    RETURN sim_time;
  ELSE
    RETURN now();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS TABLE(task_id uuid, case_id uuid, title text, due_date date, days_overdue integer)
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION check_upcoming_reminders(days_ahead integer DEFAULT 7)
RETURNS TABLE(
  reminder_id uuid,
  case_id uuid,
  rn_id uuid,
  title text,
  reminder_date date,
  days_until integer,
  priority text
)
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION check_expiring_items(days_ahead integer DEFAULT 30)
RETURNS TABLE(
  item_type text,
  item_id uuid,
  case_id uuid,
  expires_at timestamptz,
  days_until_expiry integer
)
LANGUAGE plpgsql
STABLE
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
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
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = get_current_time();
  RETURN NEW;
END;
$$;