-- Create table for daily RN CM performance metrics
CREATE TABLE IF NOT EXISTS public.rn_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rn_user_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Core performance metrics
  cases_managed INTEGER DEFAULT 0,
  new_cases_assigned INTEGER DEFAULT 0,
  cases_closed INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(10,2) DEFAULT 0,
  documentation_completion_rate DECIMAL(5,2) DEFAULT 0,
  task_completion_rate DECIMAL(5,2) DEFAULT 0,
  client_satisfaction_score DECIMAL(3,2) DEFAULT 0,
  
  -- SLA metrics
  sla_compliance_rate DECIMAL(5,2) DEFAULT 0,
  emergency_alerts_addressed INTEGER DEFAULT 0,
  emergency_alerts_within_sla INTEGER DEFAULT 0,
  
  -- Quality metrics
  care_plan_updates INTEGER DEFAULT 0,
  client_checkins_conducted INTEGER DEFAULT 0,
  documentation_quality_score DECIMAL(5,2) DEFAULT 0,
  
  -- Communication metrics
  client_messages_sent INTEGER DEFAULT 0,
  client_messages_responded INTEGER DEFAULT 0,
  attorney_collaboration_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(rn_user_id, metric_date)
);

-- Enable RLS
ALTER TABLE public.rn_daily_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rn_daily_metrics
CREATE POLICY "RN CMs can view their own metrics"
  ON public.rn_daily_metrics
  FOR SELECT
  USING (
    rn_user_id = auth.uid() OR
    has_role('RN_SUPERVISOR') OR
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "System can insert daily metrics"
  ON public.rn_daily_metrics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update daily metrics"
  ON public.rn_daily_metrics
  FOR UPDATE
  USING (true);

-- Create table for RN performance reviews
CREATE TABLE IF NOT EXISTS public.rn_performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rn_user_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  
  -- Overall ratings
  overall_rating DECIMAL(3,2) NOT NULL,
  performance_tier TEXT CHECK (performance_tier IN ('Exceeds Expectations', 'Meets Expectations', 'Needs Improvement', 'Unsatisfactory')),
  
  -- Metric-based scores (0-100)
  response_time_score DECIMAL(5,2) DEFAULT 0,
  documentation_score DECIMAL(5,2) DEFAULT 0,
  task_completion_score DECIMAL(5,2) DEFAULT 0,
  client_satisfaction_score DECIMAL(5,2) DEFAULT 0,
  sla_compliance_score DECIMAL(5,2) DEFAULT 0,
  quality_score DECIMAL(5,2) DEFAULT 0,
  
  -- Review details
  strengths TEXT,
  areas_for_improvement TEXT,
  action_items JSONB DEFAULT '[]',
  supervisor_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'acknowledged')),
  acknowledged_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rn_performance_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rn_performance_reviews
CREATE POLICY "RN CMs can view their own reviews"
  ON public.rn_performance_reviews
  FOR SELECT
  USING (
    rn_user_id = auth.uid() OR
    reviewer_id = auth.uid() OR
    has_role('RN_SUPERVISOR') OR
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "Supervisors can create reviews"
  ON public.rn_performance_reviews
  FOR INSERT
  WITH CHECK (
    has_role('RN_SUPERVISOR') OR
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "Supervisors can update reviews"
  ON public.rn_performance_reviews
  FOR UPDATE
  USING (
    reviewer_id = auth.uid() OR
    has_role('RN_SUPERVISOR') OR
    has_role('SUPER_ADMIN')
  );

-- Create indexes for performance
CREATE INDEX idx_rn_daily_metrics_user_date ON public.rn_daily_metrics(rn_user_id, metric_date DESC);
CREATE INDEX idx_rn_daily_metrics_date ON public.rn_daily_metrics(metric_date DESC);
CREATE INDEX idx_rn_performance_reviews_user ON public.rn_performance_reviews(rn_user_id);
CREATE INDEX idx_rn_performance_reviews_period ON public.rn_performance_reviews(review_period_start, review_period_end);

-- Create function to calculate metric comparisons
CREATE OR REPLACE FUNCTION get_rn_metric_comparison(
  p_rn_user_id UUID,
  p_metric_name TEXT,
  p_current_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get 6-month metrics history
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rn_daily_metrics_updated_at
  BEFORE UPDATE ON public.rn_daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rn_performance_reviews_updated_at
  BEFORE UPDATE ON public.rn_performance_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();