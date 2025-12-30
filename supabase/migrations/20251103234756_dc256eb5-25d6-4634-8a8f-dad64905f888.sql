-- Add columns to rn_daily_metrics for RN notes when below standard
ALTER TABLE public.rn_daily_metrics
ADD COLUMN IF NOT EXISTS below_standard_metrics JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS performance_notes TEXT,
ADD COLUMN IF NOT EXISTS notes_submitted_at TIMESTAMPTZ;

-- Create table for individual metric notes
CREATE TABLE IF NOT EXISTS public.rn_metric_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rn_user_id UUID NOT NULL,
  metric_date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(10,2) NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(rn_user_id, metric_date, metric_name)
);

-- Enable RLS
ALTER TABLE public.rn_metric_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "RN CMs can view their own metric notes"
  ON public.rn_metric_notes
  FOR SELECT
  USING (
    rn_user_id = auth.uid() OR
    has_role('RN_SUPERVISOR') OR
    has_role('SUPER_ADMIN')
  );

CREATE POLICY "RN CMs can insert their own metric notes"
  ON public.rn_metric_notes
  FOR INSERT
  WITH CHECK (rn_user_id = auth.uid());

CREATE POLICY "RN CMs can update their own metric notes"
  ON public.rn_metric_notes
  FOR UPDATE
  USING (rn_user_id = auth.uid());

-- Create index
CREATE INDEX idx_rn_metric_notes_user_date ON public.rn_metric_notes(rn_user_id, metric_date DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_rn_metric_notes_updated_at
  BEFORE UPDATE ON public.rn_metric_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.rn_metric_notes IS 'Allows RN CMs to document reasons for below-standard performance on specific metrics';