-- Add attorney SLA configuration table
CREATE TABLE IF NOT EXISTS public.attorney_sla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_code TEXT UNIQUE NOT NULL,
  response_time_hours INTEGER NOT NULL DEFAULT 24,
  auto_accept BOOLEAN DEFAULT false,
  fee_amount NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add client communications tracking table
CREATE TABLE IF NOT EXISTS public.client_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('INTAKE_REMINDER', 'ATTORNEY_ASSIGNED', 'STATUS_UPDATE', 'WELCOME')),
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'PORTAL')),
  status TEXT NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'DELIVERED', 'FAILED')),
  message_content TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add data retention policy table
CREATE TABLE IF NOT EXISTS public.data_retention_policy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_record_years INTEGER DEFAULT 7,
  purged_data_backup_days INTEGER DEFAULT 30,
  export_before_purge BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default retention policy
INSERT INTO public.data_retention_policy (id, client_record_years, purged_data_backup_days, export_before_purge)
VALUES (gen_random_uuid(), 7, 30, true)
ON CONFLICT DO NOTHING;

-- Add attorney performance tracking table
CREATE TABLE IF NOT EXISTS public.attorney_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attorney_code TEXT UNIQUE NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  accepted INTEGER DEFAULT 0,
  declined INTEGER DEFAULT 0,
  avg_response_time_hours NUMERIC(10,2),
  conversion_rate NUMERIC(5,2),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_communications_client_id ON public.client_communications(client_id);
CREATE INDEX IF NOT EXISTS idx_client_communications_type ON public.client_communications(type);
CREATE INDEX IF NOT EXISTS idx_attorney_sla_code ON public.attorney_sla(attorney_code);
CREATE INDEX IF NOT EXISTS idx_attorney_performance_code ON public.attorney_performance(attorney_code);

-- Add RLS policies
ALTER TABLE public.attorney_sla ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_retention_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attorney_performance ENABLE ROW LEVEL SECURITY;

-- Attorney SLA policies
CREATE POLICY "Staff can view attorney SLA" ON public.attorney_sla
  FOR SELECT USING (has_role('ATTORNEY') OR has_role('STAFF') OR has_role('RN_CCM') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Staff can manage attorney SLA" ON public.attorney_sla
  FOR ALL USING (has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Client communications policies
CREATE POLICY "Users can view communications for their cases" ON public.client_communications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM case_assignments ca
      WHERE ca.case_id = client_communications.client_id
        AND ca.user_id = auth.uid()
    ) OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
  );

CREATE POLICY "Staff can create communications" ON public.client_communications
  FOR INSERT WITH CHECK (has_role('STAFF') OR has_role('RN_CCM') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Data retention policy (read-only for most users)
CREATE POLICY "Users can view retention policy" ON public.data_retention_policy
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage retention policy" ON public.data_retention_policy
  FOR ALL USING (has_role('SUPER_ADMIN'));

-- Attorney performance policies
CREATE POLICY "Staff can view attorney performance" ON public.attorney_performance
  FOR SELECT USING (has_role('ATTORNEY') OR has_role('STAFF') OR has_role('RN_CCM') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "System can update attorney performance" ON public.attorney_performance
  FOR ALL USING (has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Function to update attorney performance metrics
CREATE OR REPLACE FUNCTION update_attorney_performance(p_attorney_code TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_total INTEGER;
  v_accepted INTEGER;
  v_declined INTEGER;
  v_avg_response NUMERIC;
BEGIN
  -- Count total referrals
  SELECT COUNT(*) INTO v_total
  FROM assignment_offers
  WHERE attorney_id IN (
    SELECT user_id FROM attorney_metadata WHERE attorney_code = p_attorney_code
  );
  
  -- Count accepted
  SELECT COUNT(*) INTO v_accepted
  FROM assignment_offers
  WHERE attorney_id IN (
    SELECT user_id FROM attorney_metadata WHERE attorney_code = p_attorney_code
  ) AND status = 'accepted';
  
  -- Count declined
  SELECT COUNT(*) INTO v_declined
  FROM assignment_offers
  WHERE attorney_id IN (
    SELECT user_id FROM attorney_metadata WHERE attorney_code = p_attorney_code
  ) AND status = 'declined';
  
  -- Calculate average response time
  SELECT AVG(EXTRACT(EPOCH FROM (responded_at - offered_at)) / 3600) INTO v_avg_response
  FROM assignment_offers
  WHERE attorney_id IN (
    SELECT user_id FROM attorney_metadata WHERE attorney_code = p_attorney_code
  ) AND responded_at IS NOT NULL;
  
  -- Upsert performance record
  INSERT INTO attorney_performance (
    attorney_code,
    total_referrals,
    accepted,
    declined,
    avg_response_time_hours,
    last_updated
  ) VALUES (
    p_attorney_code,
    v_total,
    v_accepted,
    v_declined,
    v_avg_response,
    now()
  )
  ON CONFLICT (attorney_code) DO UPDATE SET
    total_referrals = v_total,
    accepted = v_accepted,
    declined = v_declined,
    avg_response_time_hours = v_avg_response,
    last_updated = now();
END;
$$;