-- Create table for attorney monthly reports
CREATE TABLE IF NOT EXISTS public.attorney_monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_id UUID NOT NULL,
  report_month DATE NOT NULL, -- First day of the month
  total_cases INTEGER NOT NULL DEFAULT 0,
  total_time_minutes INTEGER NOT NULL DEFAULT 0,
  total_attorney_time_saved_minutes INTEGER NOT NULL DEFAULT 0,
  total_cost_savings DECIMAL(10,2) NOT NULL DEFAULT 0,
  hourly_rate_used DECIMAL(10,2) NOT NULL DEFAULT 350,
  report_data JSONB DEFAULT '{}', -- Detailed breakdown by case
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(attorney_id, report_month)
);

-- Enable RLS
ALTER TABLE public.attorney_monthly_reports ENABLE ROW LEVEL SECURITY;

-- Attorneys can view their own reports
CREATE POLICY "Attorneys can view own reports"
ON public.attorney_monthly_reports
FOR SELECT
USING (attorney_id = auth.uid() OR has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- System can create/update reports
CREATE POLICY "System can manage reports"
ON public.attorney_monthly_reports
FOR ALL
USING (has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Add trigger for updated_at
CREATE TRIGGER update_attorney_monthly_reports_updated_at
BEFORE UPDATE ON public.attorney_monthly_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate monthly report for an attorney
CREATE OR REPLACE FUNCTION public.generate_attorney_monthly_report(
  p_attorney_id UUID,
  p_report_month DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_cases INTEGER;
  v_total_time INTEGER;
  v_total_saved INTEGER;
  v_total_cost DECIMAL;
  v_hourly_rate DECIMAL := 350;
  v_report_data JSONB;
  v_case_breakdown JSONB;
BEGIN
  -- Get the first and last day of the month
  p_report_month := DATE_TRUNC('month', p_report_month)::DATE;
  
  -- Build detailed case breakdown
  SELECT jsonb_agg(
    jsonb_build_object(
      'case_id', case_id,
      'client_number', client_number,
      'client_label', client_label,
      'time_entries', time_entries,
      'total_time_minutes', total_time,
      'total_attorney_time_saved_minutes', total_saved,
      'cost_savings', ROUND((total_saved / 60.0) * v_hourly_rate, 2)
    )
  )
  INTO v_case_breakdown
  FROM (
    SELECT 
      c.id as case_id,
      c.client_number,
      c.client_label,
      COUNT(rte.id) as time_entries,
      SUM(rte.time_spent_minutes) as total_time,
      SUM(rte.estimated_attorney_time_saved_minutes) as total_saved
    FROM cases c
    INNER JOIN case_assignments ca ON ca.case_id = c.id AND ca.user_id = p_attorney_id AND ca.role = 'ATTORNEY'
    LEFT JOIN rn_time_entries rte ON rte.case_id = c.id 
      AND rte.created_at >= p_report_month 
      AND rte.created_at < (p_report_month + INTERVAL '1 month')
    WHERE rte.id IS NOT NULL
    GROUP BY c.id, c.client_number, c.client_label
  ) case_data;
  
  -- Calculate totals
  SELECT 
    COUNT(DISTINCT rte.case_id),
    COALESCE(SUM(rte.time_spent_minutes), 0),
    COALESCE(SUM(rte.estimated_attorney_time_saved_minutes), 0)
  INTO v_total_cases, v_total_time, v_total_saved
  FROM rn_time_entries rte
  INNER JOIN case_assignments ca ON ca.case_id = rte.case_id 
    AND ca.user_id = p_attorney_id 
    AND ca.role = 'ATTORNEY'
  WHERE rte.created_at >= p_report_month 
    AND rte.created_at < (p_report_month + INTERVAL '1 month');
  
  -- Calculate total cost savings
  v_total_cost := ROUND((v_total_saved / 60.0) * v_hourly_rate, 2);
  
  -- Build report data
  v_report_data := jsonb_build_object(
    'cases', COALESCE(v_case_breakdown, '[]'::jsonb),
    'summary', jsonb_build_object(
      'total_cases', v_total_cases,
      'total_time_hours', ROUND(v_total_time / 60.0, 2),
      'total_saved_hours', ROUND(v_total_saved / 60.0, 2),
      'hourly_rate', v_hourly_rate
    )
  );
  
  -- Insert or update report
  INSERT INTO public.attorney_monthly_reports (
    attorney_id,
    report_month,
    total_cases,
    total_time_minutes,
    total_attorney_time_saved_minutes,
    total_cost_savings,
    hourly_rate_used,
    report_data
  ) VALUES (
    p_attorney_id,
    p_report_month,
    v_total_cases,
    v_total_time,
    v_total_saved,
    v_total_cost,
    v_hourly_rate,
    v_report_data
  )
  ON CONFLICT (attorney_id, report_month)
  DO UPDATE SET
    total_cases = EXCLUDED.total_cases,
    total_time_minutes = EXCLUDED.total_time_minutes,
    total_attorney_time_saved_minutes = EXCLUDED.total_attorney_time_saved_minutes,
    total_cost_savings = EXCLUDED.total_cost_savings,
    report_data = EXCLUDED.report_data,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'attorney_id', p_attorney_id,
    'report_month', p_report_month,
    'total_cases', v_total_cases,
    'total_cost_savings', v_total_cost
  );
END;
$$;

-- Function to generate reports for all attorneys for a given month
CREATE OR REPLACE FUNCTION public.generate_all_attorney_monthly_reports(
  p_report_month DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_attorney RECORD;
  v_results JSONB := '[]'::jsonb;
  v_result JSONB;
BEGIN
  -- Loop through all attorneys
  FOR v_attorney IN 
    SELECT DISTINCT ur.user_id
    FROM user_roles ur
    WHERE ur.role = 'ATTORNEY'
  LOOP
    -- Generate report for this attorney
    v_result := generate_attorney_monthly_report(v_attorney.user_id, p_report_month);
    v_results := v_results || jsonb_build_array(v_result);
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'report_month', p_report_month,
    'attorneys_processed', jsonb_array_length(v_results),
    'results', v_results
  );
END;
$$;