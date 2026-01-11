-- Create rc_journal table for client journal entries with mood tracking and 4Ps tagging
CREATE TABLE IF NOT EXISTS public.rc_journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.rc_cases(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  content text NOT NULL,
  mood text, -- 'excellent', 'good', 'okay', 'poor', 'very_poor'
  p1_physical boolean DEFAULT false, -- Physical tag
  p2_psychological boolean DEFAULT false, -- Psychological tag
  p3_psychosocial boolean DEFAULT false, -- Psychosocial tag
  p4_professional boolean DEFAULT false, -- Professional tag
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for rc_journal
CREATE INDEX IF NOT EXISTS idx_rc_journal_case_time
  ON public.rc_journal (case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rc_journal_client_id
  ON public.rc_journal (client_id);

-- Enable RLS
ALTER TABLE public.rc_journal ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "allow_clients_to_read_own_journal" ON public.rc_journal
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "allow_clients_to_insert_own_journal" ON public.rc_journal
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "allow_clients_to_update_own_journal" ON public.rc_journal
  FOR UPDATE USING (auth.uid() = client_id);

-- Allow RN and attorney to read journal entries for cases they're assigned to
CREATE POLICY "allow_rn_to_read_journal" ON public.rc_journal
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.rc_case_assignments
      WHERE case_id = rc_journal.case_id
      AND user_id = auth.uid()
      AND role IN ('RN', 'ATTORNEY')
    )
  );

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_rc_journal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rc_journal_updated_at
  BEFORE UPDATE ON public.rc_journal
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rc_journal_updated_at();
