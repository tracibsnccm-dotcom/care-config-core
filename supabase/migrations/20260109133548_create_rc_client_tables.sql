-- Create rc_ prefixed tables for client checkins, medications, and audit logs
-- Migration: Add rc_ prefix to match database naming convention

-- rc_client_checkins table (with SDOH fields from intake)
CREATE TABLE IF NOT EXISTS public.rc_client_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.rc_cases(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  pain_scale int NOT NULL,
  depression_scale int DEFAULT 0,
  anxiety_scale int DEFAULT 0,
  note text,
  p_physical int NOT NULL,
  p_psychological int NOT NULL,
  p_psychosocial int NOT NULL,
  p_purpose int NOT NULL,
  sdoh_housing int,
  sdoh_food int,
  sdoh_transport int,
  sdoh_insurance int,
  sdoh_financial int,
  sdoh_employment int,
  sdoh_social_support int,
  sdoh_safety int,
  sdoh_healthcare_access int,
  sdoh_income_range text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_role text NOT NULL DEFAULT 'CLIENT'
);

-- rc_client_medications table
CREATE TABLE IF NOT EXISTS public.rc_client_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  case_id UUID NOT NULL REFERENCES public.rc_cases(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  prescribing_doctor TEXT,
  start_date DATE,
  end_date DATE,
  side_effects TEXT,
  adherence_notes TEXT,
  injury_timing TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- rc_audit_logs table
CREATE TABLE IF NOT EXISTS public.rc_audit_logs (
  id bigserial PRIMARY KEY,
  ts timestamptz DEFAULT now(),
  actor_id text,
  actor_role text,
  action text,
  case_id uuid,
  meta jsonb
);

-- Indexes for rc_client_checkins
CREATE INDEX IF NOT EXISTS idx_rc_checkins_case_time
  ON public.rc_client_checkins (case_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rc_checkins_client_id
  ON public.rc_client_checkins (client_id);

-- Indexes for rc_client_medications
CREATE INDEX IF NOT EXISTS idx_rc_medications_case_id
  ON public.rc_client_medications (case_id);

CREATE INDEX IF NOT EXISTS idx_rc_medications_client_id
  ON public.rc_client_medications (client_id);

-- Indexes for rc_audit_logs
CREATE INDEX IF NOT EXISTS idx_rc_audit_logs_case_id
  ON public.rc_audit_logs (case_id);

CREATE INDEX IF NOT EXISTS idx_rc_audit_logs_ts
  ON public.rc_audit_logs (ts DESC);

-- Enable RLS
ALTER TABLE public.rc_client_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rc_client_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rc_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now - can be tightened later)
CREATE POLICY "allow_all_rc_client_checkins" ON public.rc_client_checkins FOR ALL USING (true);
CREATE POLICY "allow_all_rc_client_medications" ON public.rc_client_medications FOR ALL USING (true);
CREATE POLICY "allow_all_rc_audit_logs" ON public.rc_audit_logs FOR ALL USING (true);
