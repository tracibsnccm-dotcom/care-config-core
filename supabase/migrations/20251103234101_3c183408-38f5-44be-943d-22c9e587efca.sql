-- Fix search_path for get_rn_metric_comparison function
CREATE OR REPLACE FUNCTION get_rn_metric_comparison(
  p_rn_user_id UUID,
  p_metric_name TEXT,
  p_current_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current DECIMAL;
  v_yesterday DECIMAL;
  v_last_week DECIMAL;
  v_result JSONB;
BEGIN
  -- Get current value
  EXECUTE format('SELECT %I FROM rn_daily_metrics WHERE rn_user_id = $1 AND metric_date = $2', p_metric_name)
  INTO v_current
  USING p_rn_user_id, p_current_date;
  
  -- Get yesterday's value
  EXECUTE format('SELECT %I FROM rn_daily_metrics WHERE rn_user_id = $1 AND metric_date = $2', p_metric_name)
  INTO v_yesterday
  USING p_rn_user_id, p_current_date - INTERVAL '1 day';
  
  -- Get last week's value
  EXECUTE format('SELECT %I FROM rn_daily_metrics WHERE rn_user_id = $1 AND metric_date = $2', p_metric_name)
  INTO v_last_week
  USING p_rn_user_id, p_current_date - INTERVAL '7 days';
  
  v_result := jsonb_build_object(
    'current', COALESCE(v_current, 0),
    'yesterday', COALESCE(v_yesterday, 0),
    'last_week', COALESCE(v_last_week, 0),
    'day_change', COALESCE(v_current - v_yesterday, 0),
    'week_change', COALESCE(v_current - v_last_week, 0),
    'day_change_percent', 
      CASE 
        WHEN v_yesterday > 0 THEN ROUND(((v_current - v_yesterday) / v_yesterday * 100)::numeric, 2)
        ELSE 0 
      END,
    'week_change_percent', 
      CASE 
        WHEN v_last_week > 0 THEN ROUND(((v_current - v_last_week) / v_last_week * 100)::numeric, 2)
        ELSE 0 
      END
  );
  
  RETURN v_result;
END;
$$;

-- Fix search_path for get_rn_metrics_history function
CREATE OR REPLACE FUNCTION get_rn_metrics_history(
  p_rn_user_id UUID,
  p_months INTEGER DEFAULT 6
)
RETURNS TABLE (
  metric_date DATE,
  cases_managed INTEGER,
  avg_response_time_hours DECIMAL,
  documentation_completion_rate DECIMAL,
  task_completion_rate DECIMAL,
  client_satisfaction_score DECIMAL,
  sla_compliance_rate DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rdm.metric_date,
    rdm.cases_managed,
    rdm.avg_response_time_hours,
    rdm.documentation_completion_rate,
    rdm.task_completion_rate,
    rdm.client_satisfaction_score,
    rdm.sla_compliance_rate
  FROM public.rn_daily_metrics rdm
  WHERE rdm.rn_user_id = p_rn_user_id
    AND rdm.metric_date >= CURRENT_DATE - (p_months || ' months')::INTERVAL
  ORDER BY rdm.metric_date DESC;
END;
$$;

-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;