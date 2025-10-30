-- Add depression and anxiety scales to client_checkins
ALTER TABLE client_checkins
  ADD COLUMN IF NOT EXISTS depression_scale int,
  ADD COLUMN IF NOT EXISTS anxiety_scale int;

-- Add validation triggers for the new scales
CREATE OR REPLACE FUNCTION validate_mental_health_scales()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.depression_scale IS NOT NULL AND (NEW.depression_scale < 0 OR NEW.depression_scale > 10) THEN
    RAISE EXCEPTION 'depression_scale must be between 0 and 10';
  END IF;
  IF NEW.anxiety_scale IS NOT NULL AND (NEW.anxiety_scale < 0 OR NEW.anxiety_scale > 10) THEN
    RAISE EXCEPTION 'anxiety_scale must be between 0 and 10';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS check_mental_health_scales ON public.client_checkins;

CREATE TRIGGER check_mental_health_scales
  BEFORE INSERT OR UPDATE ON public.client_checkins
  FOR EACH ROW
  EXECUTE FUNCTION validate_mental_health_scales();

-- Drop and recreate get_checkin_trends function with new columns
DROP FUNCTION IF EXISTS get_checkin_trends(uuid, text, timestamptz, timestamptz);

CREATE FUNCTION get_checkin_trends(
  p_case_id uuid,
  p_period text,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE (
  bucket timestamptz,
  pain_avg numeric,
  depression_avg numeric,
  anxiety_avg numeric,
  physical_avg int,
  psychological_avg int,
  psychosocial_avg int,
  purpose_avg int,
  n bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc(p_period, created_at) as bucket,
    ROUND(AVG(pain_scale)::numeric, 2) as pain_avg,
    ROUND(AVG(depression_scale)::numeric, 2) as depression_avg,
    ROUND(AVG(anxiety_scale)::numeric, 2) as anxiety_avg,
    ROUND(AVG(p_physical))::int as physical_avg,
    ROUND(AVG(p_psychological))::int as psychological_avg,
    ROUND(AVG(p_psychosocial))::int as psychosocial_avg,
    ROUND(AVG(p_purpose))::int as purpose_avg,
    COUNT(*) as n
  FROM client_checkins
  WHERE case_id = p_case_id
    AND created_at >= p_start_date
    AND created_at < p_end_date
  GROUP BY 1
  ORDER BY 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;