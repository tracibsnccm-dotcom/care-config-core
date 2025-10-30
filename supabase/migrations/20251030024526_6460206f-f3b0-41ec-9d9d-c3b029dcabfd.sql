-- Create complaints table for anonymous complaints
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_about TEXT NOT NULL CHECK (complaint_about IN ('RN_CCM', 'ATTORNEY', 'PROVIDER', 'OTHER')),
  complaint_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'under_investigation', 'resolved')),
  assigned_to UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Clients can insert anonymous complaints (no client_id stored)
CREATE POLICY "Authenticated users can file complaints"
  ON public.complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only RN CM Directors and Compliance can view complaints
CREATE POLICY "Directors and compliance can view complaints"
  ON public.complaints
  FOR SELECT
  TO authenticated
  USING (
    has_role('RN_CCM_DIRECTOR') OR 
    has_role('COMPLIANCE') OR 
    has_role('SUPER_ADMIN') OR 
    has_role('SUPER_USER')
  );

-- Only Directors and Compliance can update complaints
CREATE POLICY "Directors and compliance can update complaints"
  ON public.complaints
  FOR UPDATE
  TO authenticated
  USING (
    has_role('RN_CCM_DIRECTOR') OR 
    has_role('COMPLIANCE') OR 
    has_role('SUPER_ADMIN') OR 
    has_role('SUPER_USER')
  );

-- Add trigger for updated_at
CREATE TRIGGER update_complaints_updated_at
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add audit logging for complaints
CREATE POLICY "Audit log complaints actions"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    action IN ('complaint_filed', 'complaint_updated', 'complaint_resolved')
  );

-- Update concerns table to better distinguish identified concerns
ALTER TABLE public.concerns
  ADD COLUMN IF NOT EXISTS concern_category TEXT DEFAULT 'care_concern' CHECK (concern_category IN ('care_concern', 'provider_interaction', 'service_quality', 'other'));

COMMENT ON TABLE public.complaints IS 'Anonymous complaints filed by clients - no client identifying information stored';
COMMENT ON TABLE public.concerns IS 'Identified concerns from clients about their care - includes client_id and case_id';