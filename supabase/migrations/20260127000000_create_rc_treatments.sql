CREATE TABLE IF NOT EXISTS rc_treatments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES rc_cases(id) ON DELETE CASCADE,
  treatment_type TEXT NOT NULL,
  provider_name TEXT,
  facility_name TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  injury_related BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  progress_notes TEXT,
  discontinue_reason TEXT,
  discontinued_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS rc_treatment_reconciliations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES rc_cases(id) ON DELETE CASCADE,
  treatment_review_data JSONB,
  additional_comments TEXT,
  attested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rc_treatments_case_id ON rc_treatments(case_id);
CREATE INDEX IF NOT EXISTS idx_rc_treatments_active ON rc_treatments(is_active);
CREATE INDEX IF NOT EXISTS idx_rc_treatment_reconciliations_case_id ON rc_treatment_reconciliations(case_id);

ALTER TABLE rc_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rc_treatment_reconciliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for rc_treatments" ON rc_treatments;
CREATE POLICY "Allow all operations for rc_treatments" ON rc_treatments
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations for rc_treatment_reconciliations" ON rc_treatment_reconciliations;
CREATE POLICY "Allow all operations for rc_treatment_reconciliations" ON rc_treatment_reconciliations
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON rc_treatments TO anon;
GRANT ALL ON rc_treatments TO authenticated;
GRANT ALL ON rc_treatment_reconciliations TO anon;
GRANT ALL ON rc_treatment_reconciliations TO authenticated;