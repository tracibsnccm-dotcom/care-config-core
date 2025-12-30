-- Create rn_cm_service_requests table
CREATE TABLE IF NOT EXISTS public.rn_cm_service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attorney_id UUID NOT NULL,
  service_id TEXT NOT NULL,
  service_title TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  price_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_rn UUID,
  delivery_files JSONB DEFAULT '[]'
);

-- Enable RLS
ALTER TABLE public.rn_cm_service_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Attorneys can view their own service requests"
  ON public.rn_cm_service_requests
  FOR SELECT
  USING (attorney_id = auth.uid());

CREATE POLICY "Attorneys can create service requests"
  ON public.rn_cm_service_requests
  FOR INSERT
  WITH CHECK (attorney_id = auth.uid());

CREATE POLICY "RN CM can view all service requests"
  ON public.rn_cm_service_requests
  FOR SELECT
  USING (has_role('RN_CCM') OR has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

CREATE POLICY "RN CM can update service requests"
  ON public.rn_cm_service_requests
  FOR UPDATE
  USING (has_role('RN_CCM') OR has_role('STAFF') OR has_role('SUPER_USER') OR has_role('SUPER_ADMIN'));

-- Create updated_at trigger using existing function
CREATE TRIGGER update_rn_cm_service_requests_updated_at
  BEFORE UPDATE ON public.rn_cm_service_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better query performance
CREATE INDEX idx_rn_cm_service_requests_attorney_id ON public.rn_cm_service_requests(attorney_id);
CREATE INDEX idx_rn_cm_service_requests_status ON public.rn_cm_service_requests(status);
CREATE INDEX idx_rn_cm_service_requests_created_at ON public.rn_cm_service_requests(created_at DESC);