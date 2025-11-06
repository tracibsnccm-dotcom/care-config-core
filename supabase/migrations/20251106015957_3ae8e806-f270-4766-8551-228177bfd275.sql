-- Create role_change_audit table to track role assignment changes
CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL,
  role app_role NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('assigned', 'removed')),
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX idx_role_audit_target_user ON public.role_change_audit(target_user_id);
CREATE INDEX idx_role_audit_changed_by ON public.role_change_audit(changed_by);
CREATE INDEX idx_role_audit_changed_at ON public.role_change_audit(changed_at DESC);

-- Enable RLS
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view role audit logs"
  ON public.role_change_audit
  FOR SELECT
  USING (
    has_role(auth.uid(), 'SUPER_USER'::app_role) OR 
    has_role(auth.uid(), 'SUPER_ADMIN'::app_role)
  );

-- Policy: System can insert audit logs
CREATE POLICY "System can insert role audit logs"
  ON public.role_change_audit
  FOR INSERT
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE public.role_change_audit IS 'Audit log for tracking role assignment and removal changes';