-- Create concerns table for client feedback about providers
CREATE TABLE public.concerns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL,
  client_id uuid NOT NULL,
  concern_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  provider_name text NOT NULL,
  visit_date date,
  concern_description text NOT NULL,
  felt_respected text CHECK (felt_respected IN ('Yes', 'No', 'Somewhat')),
  care_addressed text CHECK (care_addressed IN ('Yes', 'No', 'Somewhat')),
  concern_status text NOT NULL DEFAULT 'Open' CHECK (concern_status IN ('Open', 'In Review', 'Closed')),
  rn_followup_notes text,
  assigned_rn uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.concerns ENABLE ROW LEVEL SECURITY;

-- Clients can view their own concerns
CREATE POLICY "Clients can view own concerns"
ON public.concerns
FOR SELECT
USING (
  client_id = auth.uid()
);

-- Clients can create concerns for their cases
CREATE POLICY "Clients can create concerns"
ON public.concerns
FOR INSERT
WITH CHECK (
  client_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = concerns.case_id 
    AND ca.user_id = auth.uid()
    AND ca.role = 'CLIENT'::app_role
  )
);

-- RN CCM can view concerns for their assigned cases
CREATE POLICY "RN can view assigned concerns"
ON public.concerns
FOR SELECT
USING (
  has_role('RN_CCM'::text) AND
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = concerns.case_id 
    AND ca.user_id = auth.uid()
  )
);

-- RN CCM can update concerns (status and notes)
CREATE POLICY "RN can update concerns"
ON public.concerns
FOR UPDATE
USING (
  has_role('RN_CCM'::text) AND
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = concerns.case_id 
    AND ca.user_id = auth.uid()
  )
);

-- Attorneys can view concerns for their cases
CREATE POLICY "Attorneys can view concerns"
ON public.concerns
FOR SELECT
USING (
  has_role('ATTORNEY'::text) AND
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = concerns.case_id 
    AND ca.user_id = auth.uid()
  )
);

-- Super users can view all
CREATE POLICY "Super users can view all concerns"
ON public.concerns
FOR SELECT
USING (
  has_role('SUPER_USER'::text) OR has_role('SUPER_ADMIN'::text)
);

-- Create trigger for updated_at
CREATE TRIGGER update_concerns_updated_at
BEFORE UPDATE ON public.concerns
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create table for concern attachments
CREATE TABLE public.concern_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  concern_id uuid NOT NULL REFERENCES public.concerns(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint,
  mime_type text,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on attachments
ALTER TABLE public.concern_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments for concerns they can access
CREATE POLICY "Users can view concern attachments"
ON public.concern_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM concerns c
    WHERE c.id = concern_attachments.concern_id
    AND (
      c.client_id = auth.uid() OR
      has_role('RN_CCM'::text) OR
      has_role('ATTORNEY'::text) OR
      has_role('SUPER_USER'::text) OR
      has_role('SUPER_ADMIN'::text)
    )
  )
);

-- Users can upload attachments to their concerns
CREATE POLICY "Users can upload concern attachments"
ON public.concern_attachments
FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM concerns c
    WHERE c.id = concern_attachments.concern_id
    AND c.client_id = auth.uid()
  )
);