-- Create care_plans table for storing preliminary care plans
CREATE TABLE public.care_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  plan_text text NOT NULL,
  plan_type text DEFAULT 'preliminary', -- preliminary, updated, final
  version integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.care_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for care_plans
CREATE POLICY "Users can view care plans for their cases"
ON public.care_plans
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = care_plans.case_id 
    AND ca.user_id = auth.uid()
  )
  OR has_role('SUPER_USER') 
  OR has_role('SUPER_ADMIN')
);

CREATE POLICY "RN and staff can create care plans"
ON public.care_plans
FOR INSERT
WITH CHECK (
  has_role('RN_CCM') 
  OR has_role('ATTORNEY') 
  OR has_role('STAFF') 
  OR has_role('SUPER_USER') 
  OR has_role('SUPER_ADMIN')
);

CREATE POLICY "RN and staff can update care plans"
ON public.care_plans
FOR UPDATE
USING (
  has_role('RN_CCM') 
  OR has_role('ATTORNEY') 
  OR has_role('STAFF') 
  OR has_role('SUPER_USER') 
  OR has_role('SUPER_ADMIN')
);

-- Create messages table for client-staff communication
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  recipient_role text NOT NULL, -- 'RN_CCM', 'ATTORNEY', 'PROVIDER'
  subject text NOT NULL,
  message_text text NOT NULL,
  response_text text,
  responded_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending', -- pending, responded, archived
  created_at timestamp with time zone DEFAULT now(),
  responded_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view messages for their cases"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = messages.case_id 
    AND ca.user_id = auth.uid()
  )
  OR has_role('SUPER_USER') 
  OR has_role('SUPER_ADMIN')
);

CREATE POLICY "Users can create messages for their cases"
ON public.messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = messages.case_id 
    AND ca.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can update messages"
ON public.messages
FOR UPDATE
USING (
  has_role('RN_CCM') 
  OR has_role('ATTORNEY') 
  OR has_role('PROVIDER') 
  OR has_role('STAFF') 
  OR has_role('SUPER_USER') 
  OR has_role('SUPER_ADMIN')
);

-- Create indexes for better performance
CREATE INDEX idx_care_plans_case_id ON public.care_plans(case_id);
CREATE INDEX idx_care_plans_created_at ON public.care_plans(created_at DESC);
CREATE INDEX idx_messages_case_id ON public.messages(case_id);
CREATE INDEX idx_messages_status ON public.messages(status);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- Add trigger for care_plans updated_at
CREATE TRIGGER update_care_plans_updated_at
BEFORE UPDATE ON public.care_plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();