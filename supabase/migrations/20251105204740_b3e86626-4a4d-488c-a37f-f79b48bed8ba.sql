-- Quality Improvement Projects Table
CREATE TABLE IF NOT EXISTS public.quality_improvement_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning',
  priority TEXT NOT NULL DEFAULT 'medium',
  start_date DATE NOT NULL,
  target_completion DATE,
  actual_completion DATE,
  project_lead UUID REFERENCES auth.users(id),
  description TEXT,
  baseline_metric DECIMAL,
  current_metric DECIMAL,
  target_metric DECIMAL,
  improvement_percentage DECIMAL,
  team_members JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  barriers TEXT,
  interventions TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clinical Audits Table
CREATE TABLE IF NOT EXISTS public.clinical_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_name TEXT NOT NULL,
  audit_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  auditor_id UUID REFERENCES auth.users(id),
  cases_reviewed INTEGER DEFAULT 0,
  compliance_rate DECIMAL,
  findings TEXT,
  recommendations TEXT,
  priority TEXT DEFAULT 'medium',
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Client Satisfaction Surveys Table
CREATE TABLE IF NOT EXISTS public.client_satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id),
  client_id UUID REFERENCES auth.users(id),
  rn_id UUID REFERENCES auth.users(id),
  survey_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_rating DECIMAL NOT NULL CHECK (overall_rating >= 0 AND overall_rating <= 5),
  communication_rating DECIMAL CHECK (communication_rating >= 0 AND communication_rating <= 5),
  responsiveness_rating DECIMAL CHECK (responsiveness_rating >= 0 AND responsiveness_rating <= 5),
  care_quality_rating DECIMAL CHECK (care_quality_rating >= 0 AND care_quality_rating <= 5),
  professionalism_rating DECIMAL CHECK (professionalism_rating >= 0 AND professionalism_rating <= 5),
  comments TEXT,
  would_recommend BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Team Communications/Announcements Table
CREATE TABLE IF NOT EXISTS public.team_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  communication_type TEXT NOT NULL DEFAULT 'announcement',
  priority TEXT NOT NULL DEFAULT 'normal',
  author_id UUID REFERENCES auth.users(id),
  target_roles TEXT[] DEFAULT ARRAY['RN_CCM'],
  is_urgent BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]'::jsonb,
  read_by JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Financial Metrics Table
CREATE TABLE IF NOT EXISTS public.financial_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metric_type TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  case_id UUID REFERENCES public.cases(id),
  attorney_id UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Risk Events Table
CREATE TABLE IF NOT EXISTS public.risk_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  reported_date DATE NOT NULL DEFAULT CURRENT_DATE,
  case_id UUID REFERENCES public.cases(id),
  reported_by UUID REFERENCES auth.users(id),
  description TEXT NOT NULL,
  immediate_action TEXT,
  root_cause TEXT,
  corrective_actions TEXT,
  preventive_measures TEXT,
  resolved_date DATE,
  resolved_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Credentials Tracking Table
CREATE TABLE IF NOT EXISTS public.credentials_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES auth.users(id) NOT NULL,
  credential_type TEXT NOT NULL,
  credential_name TEXT NOT NULL,
  license_number TEXT,
  issuing_organization TEXT,
  issue_date DATE,
  expiration_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  renewal_reminder_sent BOOLEAN DEFAULT false,
  documents JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Resources Inventory Table
CREATE TABLE IF NOT EXISTS public.resources_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'available',
  location TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  cost DECIMAL,
  purchase_date DATE,
  warranty_expiration DATE,
  maintenance_schedule TEXT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Strategic Goals Table
CREATE TABLE IF NOT EXISTS public.strategic_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_name TEXT NOT NULL,
  category TEXT NOT NULL,
  time_horizon TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  priority TEXT NOT NULL DEFAULT 'medium',
  owner_id UUID REFERENCES auth.users(id),
  description TEXT,
  target_date DATE,
  progress_percentage DECIMAL DEFAULT 0,
  key_results JSONB DEFAULT '[]'::jsonb,
  initiatives JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.quality_improvement_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credentials_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Quality Improvement Projects
CREATE POLICY "RN CM can view all QI projects"
  ON public.quality_improvement_projects FOR SELECT
  USING (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "RN CM can create QI projects"
  ON public.quality_improvement_projects FOR INSERT
  WITH CHECK (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR'));

CREATE POLICY "RN CM can update QI projects"
  ON public.quality_improvement_projects FOR UPDATE
  USING (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- RLS Policies for Clinical Audits
CREATE POLICY "RN CM can view all audits"
  ON public.clinical_audits FOR SELECT
  USING (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "RN CM can create audits"
  ON public.clinical_audits FOR INSERT
  WITH CHECK (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR'));

CREATE POLICY "RN CM can update audits"
  ON public.clinical_audits FOR UPDATE
  USING (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- RLS Policies for Client Satisfaction Surveys
CREATE POLICY "RN CM can view all surveys"
  ON public.client_satisfaction_surveys FOR SELECT
  USING (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Clients can create their own surveys"
  ON public.client_satisfaction_surveys FOR INSERT
  WITH CHECK (client_id = auth.uid() OR has_role('RN_CCM'));

CREATE POLICY "RN CM can view client surveys for their cases"
  ON public.client_satisfaction_surveys FOR SELECT
  USING (
    rn_id = auth.uid() OR 
    has_role('RN_CCM_DIRECTOR') OR 
    has_role('SUPER_ADMIN')
  );

-- RLS Policies for Team Communications
CREATE POLICY "Staff can view communications"
  ON public.team_communications FOR SELECT
  USING (
    has_role('RN_CCM') OR 
    has_role('RN_CCM_DIRECTOR') OR 
    has_role('STAFF') OR 
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "Directors can create communications"
  ON public.team_communications FOR INSERT
  WITH CHECK (has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Directors can update communications"
  ON public.team_communications FOR UPDATE
  USING (has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- RLS Policies for Financial Metrics
CREATE POLICY "Authorized staff can view financial metrics"
  ON public.financial_metrics FOR SELECT
  USING (
    has_role('RN_CCM_DIRECTOR') OR 
    has_role('STAFF') OR 
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "Directors can create financial metrics"
  ON public.financial_metrics FOR INSERT
  WITH CHECK (has_role('RN_CCM_DIRECTOR') OR has_role('STAFF') OR has_role('SUPER_ADMIN'));

-- RLS Policies for Risk Events
CREATE POLICY "Staff can view risk events"
  ON public.risk_events FOR SELECT
  USING (
    has_role('RN_CCM') OR 
    has_role('RN_CCM_DIRECTOR') OR 
    has_role('STAFF') OR 
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "Staff can create risk events"
  ON public.risk_events FOR INSERT
  WITH CHECK (
    has_role('RN_CCM') OR 
    has_role('RN_CCM_DIRECTOR') OR 
    has_role('STAFF')
  );

CREATE POLICY "Directors can update risk events"
  ON public.risk_events FOR UPDATE
  USING (has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- RLS Policies for Credentials Tracking
CREATE POLICY "Staff can view own credentials"
  ON public.credentials_tracking FOR SELECT
  USING (staff_id = auth.uid() OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Directors can manage all credentials"
  ON public.credentials_tracking FOR ALL
  USING (has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- RLS Policies for Resources Inventory
CREATE POLICY "Staff can view resources"
  ON public.resources_inventory FOR SELECT
  USING (
    has_role('RN_CCM') OR 
    has_role('RN_CCM_DIRECTOR') OR 
    has_role('STAFF') OR 
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "Directors can manage resources"
  ON public.resources_inventory FOR ALL
  USING (has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- RLS Policies for Strategic Goals
CREATE POLICY "Leadership can view strategic goals"
  ON public.strategic_goals FOR SELECT
  USING (
    has_role('RN_CCM_DIRECTOR') OR 
    has_role('STAFF') OR 
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "Directors can manage strategic goals"
  ON public.strategic_goals FOR ALL
  USING (has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- Create indexes for better performance
CREATE INDEX idx_qi_projects_status ON public.quality_improvement_projects(status);
CREATE INDEX idx_qi_projects_lead ON public.quality_improvement_projects(project_lead);
CREATE INDEX idx_audits_status ON public.clinical_audits(status);
CREATE INDEX idx_audits_date ON public.clinical_audits(scheduled_date);
CREATE INDEX idx_surveys_rn ON public.client_satisfaction_surveys(rn_id);
CREATE INDEX idx_surveys_date ON public.client_satisfaction_surveys(survey_date);
CREATE INDEX idx_communications_date ON public.team_communications(created_at);
CREATE INDEX idx_risk_events_status ON public.risk_events(status);
CREATE INDEX idx_credentials_expiration ON public.credentials_tracking(expiration_date);
CREATE INDEX idx_resources_status ON public.resources_inventory(status);
CREATE INDEX idx_goals_status ON public.strategic_goals(status);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_qi_projects_updated_at
  BEFORE UPDATE ON public.quality_improvement_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audits_updated_at
  BEFORE UPDATE ON public.clinical_audits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_communications_updated_at
  BEFORE UPDATE ON public.team_communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_events_updated_at
  BEFORE UPDATE ON public.risk_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON public.credentials_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON public.strategic_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();