-- Create medication change history table
CREATE TABLE IF NOT EXISTS public.medication_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID NOT NULL REFERENCES public.client_medications(id) ON DELETE CASCADE,
  case_id UUID NOT NULL,
  client_id UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('change', 'discontinue')),
  change_reason TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  notes TEXT,
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.medication_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own medication changes"
  ON public.medication_changes
  FOR SELECT
  USING (
    auth.uid() = client_id OR
    has_role('RN_CCM'::text) OR
    has_role('ATTORNEY'::text) OR
    has_role('STAFF'::text)
  );

CREATE POLICY "Users can create medication changes"
  ON public.medication_changes
  FOR INSERT
  WITH CHECK (
    auth.uid() = client_id OR
    has_role('RN_CCM'::text) OR
    has_role('ATTORNEY'::text)
  );

-- Add indexes for performance
CREATE INDEX idx_medication_changes_medication_id ON public.medication_changes(medication_id);
CREATE INDEX idx_medication_changes_case_id ON public.medication_changes(case_id);
CREATE INDEX idx_medication_changes_changed_at ON public.medication_changes(changed_at DESC);

-- Add injury_timing column to existing client_medications table
ALTER TABLE public.client_medications 
ADD COLUMN IF NOT EXISTS injury_timing TEXT CHECK (injury_timing IN ('pre-injury', 'post-injury'));

-- Add change_history jsonb column to track simple changes
ALTER TABLE public.client_medications
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb;