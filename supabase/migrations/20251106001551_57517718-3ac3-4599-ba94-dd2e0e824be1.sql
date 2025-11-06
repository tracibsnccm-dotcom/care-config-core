-- Training Records Table
CREATE TABLE IF NOT EXISTS public.training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_title TEXT NOT NULL,
  training_type TEXT NOT NULL CHECK (training_type IN ('Clinical', 'Compliance', 'Safety', 'Technology', 'Leadership', 'Other')),
  provider TEXT,
  completion_date DATE NOT NULL,
  expiration_date DATE,
  hours_completed DECIMAL(5,2),
  certification_number TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'expired', 'pending')),
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Client Satisfaction Surveys Table
CREATE TABLE IF NOT EXISTS public.client_satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  survey_date DATE NOT NULL DEFAULT CURRENT_DATE,
  overall_satisfaction INTEGER NOT NULL CHECK (overall_satisfaction >= 1 AND overall_satisfaction <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  care_quality_rating INTEGER CHECK (care_quality_rating >= 1 AND care_quality_rating <= 5),
  responsiveness_rating INTEGER CHECK (responsiveness_rating >= 1 AND responsiveness_rating <= 5),
  would_recommend BOOLEAN,
  feedback TEXT,
  concerns TEXT,
  survey_type TEXT NOT NULL DEFAULT 'periodic' CHECK (survey_type IN ('periodic', 'milestone', 'exit', 'incident')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Financial Transactions Table
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('billing', 'payment', 'reimbursement', 'expense', 'adjustment')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected', 'refunded')),
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('medical_records', 'expert_witness', 'court_filing', 'travel', 'administrative', 'other')),
  invoice_number TEXT,
  payment_method TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  due_date DATE,
  paid_date DATE,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case Reviews Table
CREATE TABLE IF NOT EXISTS public.case_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_type TEXT NOT NULL CHECK (review_type IN ('initial', 'periodic', 'milestone', 'quality', 'peer', 'supervisory')),
  review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved', 'requires_action')),
  findings TEXT,
  recommendations TEXT,
  action_items JSONB DEFAULT '[]'::jsonb,
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_period_start DATE NOT NULL,
  metric_period_end DATE NOT NULL,
  cases_handled INTEGER DEFAULT 0,
  avg_response_time_hours DECIMAL(10,2),
  client_satisfaction_avg DECIMAL(3,2),
  quality_score_avg DECIMAL(3,2),
  documentation_compliance_rate DECIMAL(5,2),
  goals_met INTEGER DEFAULT 0,
  goals_total INTEGER DEFAULT 0,
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_records
CREATE POLICY "Users can view their own training records"
ON public.training_records FOR SELECT
USING (staff_id = auth.uid() OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Directors can insert training records"
ON public.training_records FOR INSERT
WITH CHECK (has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Directors can update training records"
ON public.training_records FOR UPDATE
USING (has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- RLS Policies for client_satisfaction_surveys
CREATE POLICY "Staff can view satisfaction surveys for their cases"
ON public.client_satisfaction_surveys FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.case_assignments ca
    WHERE ca.case_id = client_satisfaction_surveys.case_id
    AND ca.user_id = auth.uid()
  ) OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN')
);

CREATE POLICY "Clients can insert their own surveys"
ON public.client_satisfaction_surveys FOR INSERT
WITH CHECK (client_id = auth.uid() OR has_role('RN_CCM') OR has_role('SUPER_ADMIN'));

-- RLS Policies for financial_transactions
CREATE POLICY "Staff can view transactions for their cases"
ON public.financial_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.case_assignments ca
    WHERE ca.case_id = financial_transactions.case_id
    AND ca.user_id = auth.uid()
  ) OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN') OR has_role('ATTORNEY')
);

CREATE POLICY "Directors can manage financial transactions"
ON public.financial_transactions FOR ALL
USING (has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- RLS Policies for case_reviews
CREATE POLICY "Staff can view reviews for their cases"
ON public.case_reviews FOR SELECT
USING (
  reviewer_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.case_assignments ca
    WHERE ca.case_id = case_reviews.case_id
    AND ca.user_id = auth.uid()
  ) OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN')
);

CREATE POLICY "Staff can create case reviews"
ON public.case_reviews FOR INSERT
WITH CHECK (reviewer_id = auth.uid() OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Reviewers can update their reviews"
ON public.case_reviews FOR UPDATE
USING (reviewer_id = auth.uid() OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- RLS Policies for performance_metrics
CREATE POLICY "Users can view their own performance metrics"
ON public.performance_metrics FOR SELECT
USING (staff_id = auth.uid() OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Directors can manage performance metrics"
ON public.performance_metrics FOR ALL
USING (has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

-- Create updated_at triggers
CREATE TRIGGER update_training_records_updated_at
  BEFORE UPDATE ON public.training_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_satisfaction_surveys_updated_at
  BEFORE UPDATE ON public.client_satisfaction_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
  BEFORE UPDATE ON public.financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_case_reviews_updated_at
  BEFORE UPDATE ON public.case_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at
  BEFORE UPDATE ON public.performance_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_records_staff ON public.training_records(staff_id);
CREATE INDEX IF NOT EXISTS idx_training_records_expiration ON public.training_records(expiration_date);
CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_case ON public.client_satisfaction_surveys(case_id);
CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_client ON public.client_satisfaction_surveys(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_case ON public.financial_transactions(case_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON public.financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_case_reviews_case ON public.case_reviews(case_id);
CREATE INDEX IF NOT EXISTS idx_case_reviews_reviewer ON public.case_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_staff ON public.performance_metrics(staff_id);