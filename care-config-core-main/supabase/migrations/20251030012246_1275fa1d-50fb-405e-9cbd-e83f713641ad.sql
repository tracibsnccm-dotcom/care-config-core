-- Fix search_path for validation functions
CREATE OR REPLACE FUNCTION validate_pain_scale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pain_scale < 0 OR NEW.pain_scale > 10 THEN
    RAISE EXCEPTION 'pain_scale must be between 0 and 10';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION validate_4p_metrics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.p_physical < 0 OR NEW.p_physical > 100 THEN
    RAISE EXCEPTION 'p_physical must be between 0 and 100';
  END IF;
  IF NEW.p_psychological < 0 OR NEW.p_psychological > 100 THEN
    RAISE EXCEPTION 'p_psychological must be between 0 and 100';
  END IF;
  IF NEW.p_psychosocial < 0 OR NEW.p_psychosocial > 100 THEN
    RAISE EXCEPTION 'p_psychosocial must be between 0 and 100';
  END IF;
  IF NEW.p_purpose < 0 OR NEW.p_purpose > 100 THEN
    RAISE EXCEPTION 'p_purpose must be between 0 and 100';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;