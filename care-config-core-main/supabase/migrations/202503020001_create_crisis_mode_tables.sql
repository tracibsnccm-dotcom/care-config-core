-- ============================================
-- Reconcile C.A.R.E. — Crisis Mode Tables
-- ============================================

-- 1) CRISIS INCIDENTS (root record)
CREATE TABLE IF NOT EXISTS public.crisis_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by_rn_id uuid NOT NULL,
  current_state text NOT NULL,

  crisis_category text,
  crisis_subtype text,
  severity_level text,

  has_weapon_present boolean,
  has_children_present boolean,
  has_other_vulnerable_persons boolean,
  substance_involved boolean,
  immediate_threat boolean,
  location_text text,
  location_verified boolean DEFAULT false,

  system_ems_urgency text,
  ems_required boolean,
  ems_called boolean DEFAULT false,
  ems_called_at timestamptz,
  ems_caller_role text,
  ems_caller_user_id uuid,
  ems_eta_text text,

  ems_decision_owner_role text,
  ems_decision_owner_user_id uuid,

  resolved_at timestamptz,
  resolved_by_user_id uuid,

  rn_view_locked boolean NOT NULL DEFAULT true,
  notes_summary text
);

-- If your main case table is named something else, adjust this FK.
ALTER TABLE public.crisis_incidents
  ADD CONSTRAINT crisis_incidents_case_fk
  FOREIGN KEY (case_id) REFERENCES public.cases(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_crisis_incidents_case_id
  ON public.crisis_incidents(case_id);

CREATE INDEX IF NOT EXISTS idx_crisis_incidents_state
  ON public.crisis_incidents(current_state);

CREATE INDEX IF NOT EXISTS idx_crisis_incidents_created_at
  ON public.crisis_incidents(created_at DESC);


-- 2) CRISIS PARTICIPANTS (RN, Buddy, Supervisor)
CREATE TABLE IF NOT EXISTS public.crisis_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.crisis_incidents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL, -- 'rn', 'buddy', 'supervisor'
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_crisis_participants_incident
  ON public.crisis_participants(incident_id);

CREATE INDEX IF NOT EXISTS idx_crisis_participants_role
  ON public.crisis_participants(role);


-- 3) CRISIS CHECKLISTS (Buddy/Supervisor safety checklist)
CREATE TABLE IF NOT EXISTS public.crisis_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.crisis_incidents(id) ON DELETE CASCADE,
  completed_by_user_id uuid NOT NULL,
  completed_by_role text NOT NULL, -- 'buddy' or 'supervisor'
  completed_at timestamptz NOT NULL DEFAULT now(),

  firearm_present boolean,
  other_weapon_present boolean,
  children_present boolean,
  vulnerable_person_present boolean,
  drugs_etoh_involved boolean,
  immediate_threat boolean,
  location_confirmed boolean,
  visible_injuries boolean,
  client_cooperative boolean,
  rn_requests_ems_now boolean,

  system_ems_urgency text -- 'high', 'moderate', 'low'
);

CREATE INDEX IF NOT EXISTS idx_crisis_checklists_incident
  ON public.crisis_checklists(incident_id);


-- 4) CRISIS ACTIONS LOG (timeline / audit trail)
CREATE TABLE IF NOT EXISTS public.crisis_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.crisis_incidents(id) ON DELETE CASCADE,
  actor_user_id uuid,
  actor_role text, -- 'rn', 'buddy', 'supervisor', 'system'
  action_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  details_json jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_crisis_actions_incident
  ON public.crisis_actions_log(incident_id);

CREATE INDEX IF NOT EXISTS idx_crisis_actions_created_at
  ON public.crisis_actions_log(created_at);


-- 5) CRISIS EMS CALLS (optional, but very useful for audits)
CREATE TABLE IF NOT EXISTS public.crisis_ems_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES public.crisis_incidents(id) ON DELETE CASCADE,
  called_by_user_id uuid NOT NULL,
  called_by_role text NOT NULL, -- 'buddy' or 'supervisor'
  called_at timestamptz NOT NULL DEFAULT now(),
  script_snapshot text,
  call_notes text,
  ems_eta_text text,
  ems_case_reference text
);

CREATE INDEX IF NOT EXISTS idx_crisis_ems_calls_incident
  ON public.crisis_ems_calls(incident_id);
