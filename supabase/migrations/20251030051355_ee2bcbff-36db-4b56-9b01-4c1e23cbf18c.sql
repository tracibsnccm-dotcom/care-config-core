-- Create attorney_rn_messages table for secure communication
CREATE TABLE public.attorney_rn_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL,
  message_text text NOT NULL,
  is_important boolean DEFAULT false,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create provider_contact_requests table
CREATE TABLE public.provider_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  urgency text NOT NULL DEFAULT 'routine' CHECK (urgency IN ('low', 'routine', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'completed')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attorney_rn_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_contact_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attorney_rn_messages
CREATE POLICY "Attorneys and RN can view messages for their cases"
ON public.attorney_rn_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = attorney_rn_messages.case_id
    AND ca.user_id = auth.uid()
    AND ca.role IN ('ATTORNEY', 'RN_CCM', 'STAFF')
  )
  OR has_role('SUPER_USER'::text)
  OR has_role('SUPER_ADMIN'::text)
);

CREATE POLICY "Attorneys and RN can create messages for their cases"
ON public.attorney_rn_messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = attorney_rn_messages.case_id
    AND ca.user_id = auth.uid()
    AND ca.role IN ('ATTORNEY', 'RN_CCM', 'STAFF')
  )
);

CREATE POLICY "Users can update their own messages"
ON public.attorney_rn_messages
FOR UPDATE
USING (sender_id = auth.uid());

-- RLS Policies for provider_contact_requests
CREATE POLICY "Attorneys and RN can view requests for their cases"
ON public.provider_contact_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = provider_contact_requests.case_id
    AND ca.user_id = auth.uid()
    AND ca.role IN ('ATTORNEY', 'RN_CCM', 'STAFF')
  )
  OR has_role('SUPER_USER'::text)
  OR has_role('SUPER_ADMIN'::text)
);

CREATE POLICY "Attorneys can create provider contact requests"
ON public.provider_contact_requests
FOR INSERT
WITH CHECK (
  requested_by = auth.uid()
  AND has_role('ATTORNEY'::text)
);

CREATE POLICY "RN and attorneys can update requests"
ON public.provider_contact_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = provider_contact_requests.case_id
    AND ca.user_id = auth.uid()
    AND ca.role IN ('ATTORNEY', 'RN_CCM')
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_attorney_rn_messages_updated_at
BEFORE UPDATE ON public.attorney_rn_messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_provider_contact_requests_updated_at
BEFORE UPDATE ON public.provider_contact_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_attorney_rn_messages_case_id ON public.attorney_rn_messages(case_id);
CREATE INDEX idx_attorney_rn_messages_sender_id ON public.attorney_rn_messages(sender_id);
CREATE INDEX idx_provider_contact_requests_case_id ON public.provider_contact_requests(case_id);
CREATE INDEX idx_provider_contact_requests_status ON public.provider_contact_requests(status);