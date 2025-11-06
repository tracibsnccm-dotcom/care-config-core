-- Create HIPAA access attempt log table
CREATE TABLE public.hipaa_access_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_role text NOT NULL,
  case_id uuid,
  feature_attempted text NOT NULL,
  access_granted boolean NOT NULL DEFAULT false,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  attempted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_hipaa_access_attempts_user_id ON public.hipaa_access_attempts(user_id);
CREATE INDEX idx_hipaa_access_attempts_case_id ON public.hipaa_access_attempts(case_id);
CREATE INDEX idx_hipaa_access_attempts_attempted_at ON public.hipaa_access_attempts(attempted_at DESC);
CREATE INDEX idx_hipaa_access_attempts_denied ON public.hipaa_access_attempts(access_granted) WHERE access_granted = false;

-- Enable RLS
ALTER TABLE public.hipaa_access_attempts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can insert access attempt logs (for tracking)
CREATE POLICY "Authenticated users can log access attempts"
ON public.hipaa_access_attempts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Compliance and admins can view all access attempts
CREATE POLICY "Compliance can view all access attempts"
ON public.hipaa_access_attempts
FOR SELECT
TO authenticated
USING (
  has_role('COMPLIANCE') OR 
  has_role('SUPER_USER') OR 
  has_role('SUPER_ADMIN')
);

-- Policy: RN Directors can view access attempts for oversight
CREATE POLICY "RN Directors can view access attempts"
ON public.hipaa_access_attempts
FOR SELECT
TO authenticated
USING (has_role('RN_CCM_DIRECTOR'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hipaa_access_attempts;