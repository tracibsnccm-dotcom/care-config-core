-- Add attorney capacity tracking
CREATE TABLE IF NOT EXISTS public.attorney_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'Active',
  capacity_limit integer NOT NULL DEFAULT 10,
  capacity_available integer NOT NULL DEFAULT 10,
  last_assigned_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Assignment audit log
CREATE TABLE IF NOT EXISTS public.assignment_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  assigned_attorney_id uuid NOT NULL,
  assigned_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  assigned_by text NOT NULL DEFAULT 'System',
  reviewed_by uuid,
  assignment_method text NOT NULL DEFAULT 'round_robin',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Round robin settings
CREATE TABLE IF NOT EXISTS public.round_robin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT true,
  check_capacity boolean NOT NULL DEFAULT true,
  allow_manual_override boolean NOT NULL DEFAULT false,
  reset_rotation_days integer DEFAULT 30,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Insert default settings
INSERT INTO public.round_robin_settings (enabled, check_capacity, allow_manual_override, reset_rotation_days)
VALUES (true, true, false, 30)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.attorney_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_robin_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attorney_metadata
CREATE POLICY "Staff can view attorney metadata"
ON public.attorney_metadata FOR SELECT
USING (
  has_role('ATTORNEY'::text) OR 
  has_role('STAFF'::text) OR 
  has_role('RN_CCM'::text) OR 
  has_role('SUPER_USER'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

CREATE POLICY "Staff can update attorney metadata"
ON public.attorney_metadata FOR UPDATE
USING (
  has_role('STAFF'::text) OR 
  has_role('SUPER_USER'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

CREATE POLICY "Staff can insert attorney metadata"
ON public.attorney_metadata FOR INSERT
WITH CHECK (
  has_role('STAFF'::text) OR 
  has_role('SUPER_USER'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

-- RLS Policies for assignment_audit_log
CREATE POLICY "Staff can view assignment audit log"
ON public.assignment_audit_log FOR SELECT
USING (
  has_role('ATTORNEY'::text) OR 
  has_role('STAFF'::text) OR 
  has_role('RN_CCM'::text) OR 
  has_role('SUPER_USER'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

CREATE POLICY "System can insert assignment audit log"
ON public.assignment_audit_log FOR INSERT
WITH CHECK (true);

-- RLS Policies for round_robin_settings
CREATE POLICY "Staff can view round robin settings"
ON public.round_robin_settings FOR SELECT
USING (
  has_role('STAFF'::text) OR 
  has_role('RN_CCM'::text) OR 
  has_role('SUPER_USER'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

CREATE POLICY "Admins can update round robin settings"
ON public.round_robin_settings FOR UPDATE
USING (
  has_role('SUPER_USER'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

-- Create function to get next round robin attorney
CREATE OR REPLACE FUNCTION public.get_next_round_robin_attorney()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_attorney_id uuid;
  settings record;
BEGIN
  -- Get settings
  SELECT * INTO settings FROM round_robin_settings LIMIT 1;
  
  IF NOT settings.enabled THEN
    RETURN NULL;
  END IF;
  
  -- Find next eligible attorney
  SELECT am.user_id INTO next_attorney_id
  FROM attorney_metadata am
  JOIN user_roles ur ON ur.user_id = am.user_id AND ur.role = 'ATTORNEY'
  WHERE am.status = 'Active'
    AND (NOT settings.check_capacity OR am.capacity_available > 0)
  ORDER BY 
    COALESCE(am.last_assigned_date, '1970-01-01'::timestamp with time zone) ASC,
    am.created_at ASC
  LIMIT 1;
  
  RETURN next_attorney_id;
END;
$$;

-- Create function to assign attorney via round robin
CREATE OR REPLACE FUNCTION public.assign_attorney_round_robin(
  p_case_id uuid,
  p_reviewed_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attorney_id uuid;
BEGIN
  -- Get next attorney
  v_attorney_id := get_next_round_robin_attorney();
  
  IF v_attorney_id IS NULL THEN
    RAISE EXCEPTION 'No eligible attorneys available for round robin assignment';
  END IF;
  
  -- Assign case
  INSERT INTO case_assignments (case_id, user_id, role)
  VALUES (p_case_id, v_attorney_id, 'ATTORNEY')
  ON CONFLICT DO NOTHING;
  
  -- Update attorney metadata
  UPDATE attorney_metadata
  SET 
    last_assigned_date = now(),
    capacity_available = GREATEST(0, capacity_available - 1),
    updated_at = now()
  WHERE user_id = v_attorney_id;
  
  -- Log assignment
  INSERT INTO assignment_audit_log (
    case_id,
    assigned_attorney_id,
    assigned_timestamp,
    assigned_by,
    reviewed_by,
    assignment_method
  ) VALUES (
    p_case_id,
    v_attorney_id,
    now(),
    'System',
    p_reviewed_by,
    'round_robin'
  );
  
  -- Add audit log entry
  INSERT INTO audit_logs (
    actor_id,
    actor_role,
    action,
    case_id,
    meta
  ) VALUES (
    p_reviewed_by,
    'RN_CCM',
    'attorney_assigned_round_robin',
    p_case_id,
    jsonb_build_object(
      'attorney_id', v_attorney_id,
      'method', 'round_robin'
    )
  );
  
  RETURN v_attorney_id;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_attorney_metadata_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_attorney_metadata_updated_at
BEFORE UPDATE ON public.attorney_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_attorney_metadata_updated_at();

CREATE TRIGGER update_round_robin_settings_updated_at
BEFORE UPDATE ON public.round_robin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_attorney_metadata_updated_at();