-- Create e-sign templates table
CREATE TABLE public.e_sign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  template_content TEXT NOT NULL,
  merge_fields JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create e-sign requests table
CREATE TABLE public.e_sign_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.e_sign_templates(id),
  signer_id UUID NOT NULL REFERENCES auth.users(id),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'signed', 'declined', 'expired')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  expired_at TIMESTAMP WITH TIME ZONE,
  document_path TEXT,
  pdf_hash TEXT,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create e-sign audit logs table
CREATE TABLE public.e_sign_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.e_sign_requests(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case summaries table (for AI-generated summaries)
CREATE TABLE public.case_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  summary_type TEXT NOT NULL DEFAULT 'clinical-legal',
  summary_content TEXT NOT NULL,
  generated_by UUID NOT NULL REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  edited_content TEXT,
  edited_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_e_sign_requests_case_id ON public.e_sign_requests(case_id);
CREATE INDEX idx_e_sign_requests_signer_id ON public.e_sign_requests(signer_id);
CREATE INDEX idx_e_sign_requests_status ON public.e_sign_requests(status);
CREATE INDEX idx_e_sign_audit_logs_request_id ON public.e_sign_audit_logs(request_id);
CREATE INDEX idx_case_summaries_case_id ON public.case_summaries(case_id);

-- Enable RLS
ALTER TABLE public.e_sign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_sign_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.e_sign_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for e_sign_templates
CREATE POLICY "Attorneys and RN can view templates"
  ON public.e_sign_templates FOR SELECT
  USING (has_role('ATTORNEY') OR has_role('RN_CCM') OR has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Attorneys and RN can create templates"
  ON public.e_sign_templates FOR INSERT
  WITH CHECK (has_role('ATTORNEY') OR has_role('RN_CCM') OR has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- RLS Policies for e_sign_requests
CREATE POLICY "Users can view their sign requests"
  ON public.e_sign_requests FOR SELECT
  USING (
    signer_id = auth.uid() OR
    requested_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM case_assignments ca
      WHERE ca.case_id = e_sign_requests.case_id
        AND ca.user_id = auth.uid()
        AND ca.role IN ('ATTORNEY', 'RN_CCM', 'STAFF')
    ) OR
    has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
  );

CREATE POLICY "Attorneys and RN can create sign requests"
  ON public.e_sign_requests FOR INSERT
  WITH CHECK (
    requested_by = auth.uid() AND
    (has_role('ATTORNEY') OR has_role('RN_CCM') OR has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'))
  );

CREATE POLICY "Signers and requestors can update sign requests"
  ON public.e_sign_requests FOR UPDATE
  USING (signer_id = auth.uid() OR requested_by = auth.uid());

-- RLS Policies for e_sign_audit_logs
CREATE POLICY "Attorneys and RN can view audit logs"
  ON public.e_sign_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM e_sign_requests esr
      JOIN case_assignments ca ON ca.case_id = esr.case_id
      WHERE esr.id = e_sign_audit_logs.request_id
        AND ca.user_id = auth.uid()
        AND ca.role IN ('ATTORNEY', 'RN_CCM', 'STAFF')
    ) OR
    has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
  );

CREATE POLICY "System can insert audit logs"
  ON public.e_sign_audit_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for case_summaries
CREATE POLICY "Users can view summaries for their cases"
  ON public.case_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM case_assignments ca
      WHERE ca.case_id = case_summaries.case_id
        AND ca.user_id = auth.uid()
    ) OR
    has_role('SUPER_USER') OR has_role('SUPER_ADMIN')
  );

CREATE POLICY "Attorneys and RN can create summaries"
  ON public.case_summaries FOR INSERT
  WITH CHECK (
    generated_by = auth.uid() AND
    (has_role('ATTORNEY') OR has_role('RN_CCM') OR has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'))
  );

CREATE POLICY "Users can update their own summaries"
  ON public.case_summaries FOR UPDATE
  USING (generated_by = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER update_e_sign_templates_updated_at
  BEFORE UPDATE ON public.e_sign_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_e_sign_requests_updated_at
  BEFORE UPDATE ON public.e_sign_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();