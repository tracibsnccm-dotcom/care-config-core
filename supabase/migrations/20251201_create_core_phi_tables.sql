-- Core PHI / case-management tables for Reconcile C.A.R.E.
-- Phase 1: Minimum needed for real cases, RN notes, crisis, and documents.

-- We will later connect these to Supabase auth.users via auth_user_id.
-- For now this is the data skeleton.

-- -----------------------------
-- Users / Roles
-- -----------------------------

create table if not exists rc_users (
  id uuid primary key default gen_random_uuid(),
  -- Supabase auth user id (from auth.users.id)
  auth_user_id uuid not null unique,
  role text not null check (role in ('attorney', 'rn_cm', 'supervisor', 'provider', 'client')),
  full_name text,
  created_at timestamptz default now()
);

-- -----------------------------
-- Clients
-- -----------------------------

create table if not exists rc_clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references rc_users(id) on delete set null,
  -- PHI fields (keep minimal for Phase 1)
  first_name text,
  last_name text,
  date_of_birth date,
  phone text,
  email text,
  created_at timestamptz default now()
);

-- -----------------------------
-- Cases
-- -----------------------------

create table if not exists rc_cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references rc_clients(id) on delete cascade,
  attorney_id uuid references rc_users(id),
  case_type text,              -- e.g. 'PI', 'WC'
  case_status text,            -- e.g. 'open', 'closed', 'hold'
  date_of_injury date,
  jurisdiction text,
  created_at timestamptz default now()
);

-- -----------------------------
-- RN Notes
-- -----------------------------

create table if not exists rc_rn_notes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rc_cases(id) on delete cascade,
  rn_id uuid references rc_users(id),
  note_type text,              -- e.g. 'follow_up', 'intake', 'update'
  note_body text,              -- PHI narrative
  four_p_focus text,           -- optional: Physical / Psychological / Psychosocial / Professional
  ten_v_key text,              -- optional: one of your 10-Vs codes
  created_at timestamptz default now()
);

-- -----------------------------
-- Crisis Events (link to your current crisis work later)
-- -----------------------------

create table if not exists rc_crisis_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rc_cases(id) on delete cascade,
  rn_id uuid references rc_users(id),
  category text,               -- e.g. 'behavioral_suicide', 'medical', 'violence_assault', 'other'
  description text,
  ems_contacted boolean default false,
  law_enforcement_contacted boolean default false,
  resolved boolean default false,
  created_at timestamptz default now()
);

-- -----------------------------
-- Documents (HIPAA file storage)
-- -----------------------------

create table if not exists rc_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references rc_cases(id) on delete cascade,
  uploaded_by uuid references rc_users(id),
  file_name text,
  file_type text,
  storage_path text,          -- path in Supabase storage bucket
  created_at timestamptz default now()
);

-- -----------------------------
-- Enable Row Level Security (RLS)
-- (We will add detailed policies in a later step.)
-- -----------------------------

alter table rc_users          enable row level security;
alter table rc_clients        enable row level security;
alter table rc_cases          enable row level security;
alter table rc_rn_notes       enable row level security;
alter table rc_crisis_events  enable row level security;
alter table rc_documents      enable row level security;

