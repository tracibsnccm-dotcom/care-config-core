-- Create client_checkins table
CREATE TABLE IF NOT EXISTS public.client_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  client_id uuid NOT NULL,
  pain_scale int NOT NULL,
  note text,
  p_physical int NOT NULL,
  p_psychological int NOT NULL,
  p_psychosocial int NOT NULL,
  p_purpose int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_role text NOT NULL DEFAULT 'CLIENT'
);

-- Add validation trigger for pain_scale
CREATE OR REPLACE FUNCTION validate_pain_scale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.pain_scale < 0 OR NEW.pain_scale > 10 THEN
    RAISE EXCEPTION 'pain_scale must be between 0 and 10';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_pain_scale
  BEFORE INSERT OR UPDATE ON public.client_checkins
  FOR EACH ROW
  EXECUTE FUNCTION validate_pain_scale();

-- Add validation trigger for 4P metrics
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_4p_metrics
  BEFORE INSERT OR UPDATE ON public.client_checkins
  FOR EACH ROW
  EXECUTE FUNCTION validate_4p_metrics();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_checkins_case_time
  ON public.client_checkins (case_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.client_checkins ENABLE ROW LEVEL SECURITY;

-- Clients can create their own check-ins
CREATE POLICY "Clients can create check-ins for their cases"
  ON public.client_checkins
  FOR INSERT
  WITH CHECK (
    client_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM case_assignments ca
      WHERE ca.case_id = client_checkins.case_id
        AND ca.user_id = auth.uid()
        AND ca.role = 'CLIENT'
    )
  );

-- Users can view check-ins for their cases
CREATE POLICY "Users can view check-ins for their cases"
  ON public.client_checkins
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM case_assignments ca
      WHERE ca.case_id = client_checkins.case_id
        AND ca.user_id = auth.uid()
    ) OR
    has_role('SUPER_USER') OR
    has_role('SUPER_ADMIN')
  );

-- Staff can update check-ins
CREATE POLICY "Staff can update check-ins"
  ON public.client_checkins
  FOR UPDATE
  USING (
    has_role('RN_CCM') OR
    has_role('ATTORNEY') OR
    has_role('STAFF') OR
    has_role('SUPER_USER') OR
    has_role('SUPER_ADMIN')
  );

-- Create function to get aggregated check-in data
CREATE OR REPLACE FUNCTION get_checkin_trends(
  p_case_id uuid,
  p_period text,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE (
  bucket timestamptz,
  pain_avg numeric,
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