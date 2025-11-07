-- Fix SECURITY DEFINER functions missing SET search_path

-- Fix get_rn_performance_snapshot function
CREATE OR REPLACE FUNCTION get_rn_performance_snapshot(
  p_rn_user_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_cases_managed INTEGER;
  v_avg_response_time DECIMAL;
  v_doc_completion_rate DECIMAL;
  v_task_completion_rate DECIMAL;
  v_satisfaction_score DECIMAL;
  v_sla_compliance_rate DECIMAL;
  v_current INTEGER;
  v_last_week INTEGER;
BEGIN
  -- Get current period metrics
  SELECT 
    COUNT(DISTINCT c.id),
    COALESCE(AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600), 0),
    COALESCE(AVG(CASE WHEN c.documentation_status = 'complete' THEN 1 ELSE 0 END) * 100, 0),
    COALESCE(AVG(CASE WHEN c.task_status = 'completed' THEN 1 ELSE 0 END) * 100, 0),
    COALESCE(AVG(cc.satisfaction_rating), 0),
    COALESCE(AVG(CASE WHEN c.sla_met THEN 1 ELSE 0 END) * 100, 0)
  INTO 
    v_cases_managed,
    v_avg_response_time,
    v_doc_completion_rate,
    v_task_completion_rate,
    v_satisfaction_score,
    v_sla_compliance_rate
  FROM public.cases c
  LEFT JOIN public.client_checkins cc ON cc.case_id = c.id
  WHERE c.rn_assigned_id = p_rn_user_id
    AND c.created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL;
  
  -- Get current week for comparison
  SELECT COUNT(DISTINCT c.id) INTO v_current
  FROM public.cases c
  WHERE c.rn_assigned_id = p_rn_user_id
    AND c.created_at >= CURRENT_DATE - INTERVAL '7 days';
  
  -- Get last week for comparison
  SELECT COUNT(DISTINCT c.id) INTO v_last_week
  FROM public.cases c
  WHERE c.rn_assigned_id = p_rn_user_id
    AND c.created_at >= CURRENT_DATE - INTERVAL '14 days'
    AND c.created_at < CURRENT_DATE - INTERVAL '7 days';
  
  v_result := json_build_object(
    'cases_managed', v_cases_managed,
    'avg_response_time_hours', ROUND(v_avg_response_time, 2),
    'documentation_completion_rate', ROUND(v_doc_completion_rate, 2),
    'task_completion_rate', ROUND(v_task_completion_rate, 2),
    'client_satisfaction_score', ROUND(v_satisfaction_score, 2),
    'sla_compliance_rate', ROUND(v_sla_compliance_rate, 2),
    'current_week', v_current,
    'last_week', v_last_week,
    'week_change_percent', 
      CASE 
        WHEN v_last_week > 0 THEN ROUND(((v_current - v_last_week) / v_last_week * 100)::numeric, 2)
        ELSE 0 
      END
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix get_rn_metrics_history function
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
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;