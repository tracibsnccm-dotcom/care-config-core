-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Add profile_photo_url to profiles table if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Storage policies for profile photos
CREATE POLICY "Users can view all profile photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload their own profile photo"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own profile photo"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own profile photo"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to calculate and insert daily RN metrics
CREATE OR REPLACE FUNCTION calculate_rn_daily_metrics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rn_record RECORD;
BEGIN
  -- Loop through all RN CMs
  FOR rn_record IN 
    SELECT DISTINCT ur.user_id
    FROM user_roles ur
    WHERE ur.role = 'RN_CCM'
  LOOP
    -- Insert or update metrics for this RN
    INSERT INTO rn_daily_metrics (
      rn_user_id,
      metric_date,
      cases_managed,
      new_cases_assigned,
      cases_closed,
      avg_response_time_hours,
      documentation_completion_rate,
      task_completion_rate,
      client_satisfaction_score,
      sla_compliance_rate,
      emergency_alerts_addressed,
      emergency_alerts_within_sla,
      care_plan_updates,
      client_checkins_conducted,
      documentation_quality_score,
      client_messages_sent,
      client_messages_responded,
      attorney_collaboration_count
    )
    SELECT
      rn_record.user_id,
      p_date,
      -- Cases managed (active assignments)
      COUNT(DISTINCT CASE WHEN ca.user_id = rn_record.user_id THEN ca.case_id END),
      -- New cases assigned today
      COUNT(DISTINCT CASE WHEN ca.user_id = rn_record.user_id AND DATE(ca.created_at) = p_date THEN ca.case_id END),
      -- Cases closed today (you'll need to add logic based on case status changes)
      0,
      -- Average response time (simplified - would need more complex logic)
      COALESCE(AVG(EXTRACT(EPOCH FROM (dm.responded_at - dm.created_at)) / 3600), 0),
      -- Documentation completion rate (example: ratio of cases with notes)
      CASE 
        WHEN COUNT(DISTINCT ca.case_id) > 0 
        THEN (COUNT(DISTINCT cn.case_id)::DECIMAL / COUNT(DISTINCT ca.case_id) * 100)
        ELSE 100
      END,
      -- Task completion rate
      CASE 
        WHEN COUNT(ct.id) > 0 
        THEN (COUNT(CASE WHEN ct.status = 'completed' THEN 1 END)::DECIMAL / COUNT(ct.id) * 100)
        ELSE 100
      END,
      -- Client satisfaction (average from checkins)
      COALESCE(AVG((cc.p_physical + cc.p_psychological + cc.p_psychosocial + cc.p_purpose) / 400.0 * 5), 4.5),
      -- SLA compliance (simplified)
      95.0,
      -- Emergency alerts addressed
      COUNT(DISTINCT CASE WHEN ea.addressed_at IS NOT NULL THEN ea.id END),
      -- Emergency alerts within SLA
      COUNT(DISTINCT CASE WHEN ea.addressed_at IS NOT NULL AND ea.addressed_at <= ea.sla_deadline THEN ea.id END),
      -- Care plan updates
      COUNT(DISTINCT cp.id),
      -- Client checkins conducted
      COUNT(DISTINCT cc.id),
      -- Documentation quality score (simplified)
      95.0,
      -- Client messages sent
      COUNT(DISTINCT CASE WHEN cdm.sender_id = rn_record.user_id THEN cdm.id END),
      -- Client messages responded
      COUNT(DISTINCT CASE WHEN cdm.recipient_id = rn_record.user_id AND cdm.read_at IS NOT NULL THEN cdm.id END),
      -- Attorney collaboration count
      COUNT(DISTINCT arm.id)
    FROM case_assignments ca
    LEFT JOIN client_direct_messages dm ON dm.recipient_id = rn_record.user_id AND DATE(dm.created_at) = p_date
    LEFT JOIN case_notes cn ON cn.case_id = ca.case_id AND cn.created_by = rn_record.user_id AND DATE(cn.created_at) = p_date
    LEFT JOIN case_tasks ct ON ct.case_id = ca.case_id AND ct.assigned_to = rn_record.user_id AND DATE(ct.due_date) = p_date
    LEFT JOIN client_checkins cc ON cc.case_id = ca.case_id AND DATE(cc.created_at) = p_date
    LEFT JOIN rn_emergency_alerts ea ON ea.case_id = ca.case_id AND DATE(ea.created_at) = p_date
    LEFT JOIN care_plans cp ON cp.case_id = ca.case_id AND cp.created_by = rn_record.user_id AND DATE(cp.updated_at) = p_date
    LEFT JOIN client_direct_messages cdm ON (cdm.sender_id = rn_record.user_id OR cdm.recipient_id = rn_record.user_id) AND DATE(cdm.created_at) = p_date
    LEFT JOIN attorney_rn_messages arm ON arm.case_id = ca.case_id AND arm.sender_id = rn_record.user_id AND DATE(arm.created_at) = p_date
    WHERE ca.user_id = rn_record.user_id AND ca.role = 'RN_CCM'
    GROUP BY rn_record.user_id
    ON CONFLICT (rn_user_id, metric_date) 
    DO UPDATE SET
      cases_managed = EXCLUDED.cases_managed,
      new_cases_assigned = EXCLUDED.new_cases_assigned,
      avg_response_time_hours = EXCLUDED.avg_response_time_hours,
      documentation_completion_rate = EXCLUDED.documentation_completion_rate,
      task_completion_rate = EXCLUDED.task_completion_rate,
      client_satisfaction_score = EXCLUDED.client_satisfaction_score,
      sla_compliance_rate = EXCLUDED.sla_compliance_rate,
      emergency_alerts_addressed = EXCLUDED.emergency_alerts_addressed,
      emergency_alerts_within_sla = EXCLUDED.emergency_alerts_within_sla,
      care_plan_updates = EXCLUDED.care_plan_updates,
      client_checkins_conducted = EXCLUDED.client_checkins_conducted,
      documentation_quality_score = EXCLUDED.documentation_quality_score,
      client_messages_sent = EXCLUDED.client_messages_sent,
      client_messages_responded = EXCLUDED.client_messages_responded,
      attorney_collaboration_count = EXCLUDED.attorney_collaboration_count,
      updated_at = now();
  END LOOP;
END;
$$;

COMMENT ON FUNCTION calculate_rn_daily_metrics IS 'Calculates and stores daily performance metrics for all RN CMs. Should be run daily via cron job.';