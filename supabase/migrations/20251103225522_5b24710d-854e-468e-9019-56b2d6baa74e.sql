-- Add SLA tracking and acknowledgment fields to rn_emergency_alerts
ALTER TABLE rn_emergency_alerts
ADD COLUMN shift_start_time timestamp with time zone,
ADD COLUMN sla_deadline timestamp with time zone,
ADD COLUMN addressed_at timestamp with time zone,
ADD COLUMN addressed_by uuid,
ADD COLUMN address_method text CHECK (address_method IN ('phone_call', 'text_message', 'email', 'in_person')),
ADD COLUMN resolution_note text;

-- Create function to calculate SLA deadline based on alert type
CREATE OR REPLACE FUNCTION calculate_alert_sla_deadline(
  p_alert_type text,
  p_shift_start timestamp with time zone
)
RETURNS timestamp with time zone
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Suicidal/homicidal ideation: 1 hour from shift start
  IF p_alert_type IN ('suicidal_ideation', 'homicidal_ideation', '911_trigger', '988_trigger') THEN
    RETURN p_shift_start + interval '1 hour';
  -- Other emergencies: 2 hours from shift start
  ELSIF p_alert_type IN ('sdoh_housing', 'sdoh_food', 'sdoh_transport', 'sdoh_insurance', 'critical_pain', 'high_risk') THEN
    RETURN p_shift_start + interval '2 hours';
  ELSE
    RETURN p_shift_start + interval '4 hours';
  END IF;
END;
$$;

-- Create trigger to automatically set SLA deadline on insert
CREATE OR REPLACE FUNCTION set_alert_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If shift_start_time is provided, calculate deadline
  IF NEW.shift_start_time IS NOT NULL THEN
    NEW.sla_deadline := calculate_alert_sla_deadline(NEW.alert_type, NEW.shift_start_time);
  -- Otherwise use current time as shift start
  ELSE
    NEW.shift_start_time := now();
    NEW.sla_deadline := calculate_alert_sla_deadline(NEW.alert_type, now());
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_alert_sla_trigger
BEFORE INSERT ON rn_emergency_alerts
FOR EACH ROW
EXECUTE FUNCTION set_alert_sla();

-- Add index for faster queries on unaddressed alerts
CREATE INDEX idx_emergency_alerts_unaddressed ON rn_emergency_alerts(addressed_at, sla_deadline) WHERE addressed_at IS NULL;