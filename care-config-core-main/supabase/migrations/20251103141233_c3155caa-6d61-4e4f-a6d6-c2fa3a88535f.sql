-- Create table for RN CM time tracking
CREATE TABLE public.rn_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  rn_user_id UUID NOT NULL,
  attorney_id UUID,
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  time_spent_minutes INTEGER NOT NULL,
  estimated_attorney_time_saved_minutes INTEGER NOT NULL DEFAULT 0,
  hourly_rate_used NUMERIC,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.rn_time_entries ENABLE ROW LEVEL SECURITY;

-- RN can create their own time entries
CREATE POLICY "RN can create own time entries"
ON public.rn_time_entries
FOR INSERT
WITH CHECK (
  rn_user_id = auth.uid() AND 
  has_role('RN_CCM')
);

-- RN can view their own time entries
CREATE POLICY "RN can view own time entries"
ON public.rn_time_entries
FOR SELECT
USING (
  rn_user_id = auth.uid() OR 
  has_role('ATTORNEY') OR 
  has_role('STAFF') OR 
  has_role('SUPER_USER') OR 
  has_role('SUPER_ADMIN')
);

-- RN can update their own time entries
CREATE POLICY "RN can update own time entries"
ON public.rn_time_entries
FOR UPDATE
USING (rn_user_id = auth.uid());

-- Attorneys can view time entries for their cases
CREATE POLICY "Attorneys can view time entries for their cases"
ON public.rn_time_entries
FOR SELECT
USING (
  has_role('ATTORNEY') AND 
  EXISTS (
    SELECT 1 FROM case_assignments ca 
    WHERE ca.case_id = rn_time_entries.case_id 
    AND ca.user_id = auth.uid()
  )
);

-- Create index for performance
CREATE INDEX idx_rn_time_entries_case_id ON public.rn_time_entries(case_id);
CREATE INDEX idx_rn_time_entries_rn_user_id ON public.rn_time_entries(rn_user_id);
CREATE INDEX idx_rn_time_entries_attorney_id ON public.rn_time_entries(attorney_id);
CREATE INDEX idx_rn_time_entries_entry_date ON public.rn_time_entries(entry_date);

-- Add trigger for updated_at
CREATE TRIGGER update_rn_time_entries_updated_at
BEFORE UPDATE ON public.rn_time_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();