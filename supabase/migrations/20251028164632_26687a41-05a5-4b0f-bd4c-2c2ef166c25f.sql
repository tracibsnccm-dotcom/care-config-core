-- ==========================================================
-- RCMS C.A.R.E. — Minimal Secure Schema + RLS (Supabase)
-- Fixed to use existing app_role enum
-- ==========================================================

-- 0) Enable UUIDs
create extension if not exists "uuid-ossp";

-- 1) Extend app_role enum if needed
DO $$ BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'ATTORNEY';
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'CLIENT';
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'PROVIDER';
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'RN_CCM';
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'STAFF';
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'SUPER_USER';
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2) Auth-linked profiles (extend existing)
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_id uuid references auth.users(id) on delete cascade;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 3) Core tables
create table if not exists public.cases (
  id uuid primary key default uuid_generate_v4(),
  atty_ref text,
  client_label text,
  consent jsonb default '{}'::jsonb,
  status text default 'NEW',
  incident jsonb default '{}'::jsonb,
  fourps jsonb,
  sdoh jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.case_assignments (
  case_id uuid references public.cases(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role app_role not null,
  primary key (case_id, user_id, role)
);

create table if not exists public.checkins (
  id uuid primary key default uuid_generate_v4(),
  case_id uuid references public.cases(id) on delete cascade,
  user_id uuid references auth.users(id),
  payload jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id bigserial primary key,
  ts timestamptz default now(),
  actor_id uuid,
  actor_role text,
  action text,
  case_id uuid,
  meta jsonb
);

-- 4) Helper: simplified has_role that takes text and casts
create or replace function public.has_role(check_role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role::text = check_role
  );
$$;

-- 5) Enable RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.cases enable row level security;
alter table public.case_assignments enable row level security;
alter table public.checkins enable row level security;
alter table public.audit_logs enable row level security;

-- 6) RLS Policies

-- profiles
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
for select using (user_id = auth.uid() or has_role('SUPER_USER') or has_role('SUPER_ADMIN'));

drop policy if exists "profiles_self_insert" on public.profiles;
create policy "profiles_self_insert" on public.profiles
for insert with check (user_id = auth.uid());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
for update using (user_id = auth.uid());

-- user_roles
drop policy if exists "roles_self_read" on public.user_roles;
create policy "roles_self_read" on public.user_roles
for select using (user_id = auth.uid() or has_role('SUPER_USER') or has_role('SUPER_ADMIN'));

drop policy if exists "roles_admin_insert" on public.user_roles;
create policy "roles_admin_insert" on public.user_roles
for insert with check (has_role('SUPER_USER') or has_role('SUPER_ADMIN'));

drop policy if exists "roles_admin_delete" on public.user_roles;
create policy "roles_admin_delete" on public.user_roles
for delete using (has_role('SUPER_USER') or has_role('SUPER_ADMIN'));

-- cases
drop policy if exists "cases_visibility" on public.cases;
create policy "cases_visibility" on public.cases
for select using (
  exists (select 1 from public.case_assignments ca where ca.case_id = cases.id and ca.user_id = auth.uid())
  or has_role('SUPER_USER') or has_role('SUPER_ADMIN')
);

drop policy if exists "cases_create" on public.cases;
create policy "cases_create" on public.cases
for insert with check (
  has_role('ATTORNEY') or has_role('STAFF') or has_role('SUPER_USER') or has_role('SUPER_ADMIN')
);

drop policy if exists "cases_update" on public.cases;
create policy "cases_update" on public.cases
for update using (
  exists (
    select 1 from public.case_assignments ca
    where ca.case_id = cases.id and ca.user_id = auth.uid()
      and ca.role::text in ('ATTORNEY','RN_CCM','STAFF')
  )
  or has_role('SUPER_USER') or has_role('SUPER_ADMIN')
);

-- case_assignments
drop policy if exists "assignments_read" on public.case_assignments;
create policy "assignments_read" on public.case_assignments
for select using (
  user_id = auth.uid()
  or has_role('SUPER_USER') or has_role('SUPER_ADMIN')
  or exists (select 1 from public.case_assignments me where me.case_id = case_assignments.case_id and me.user_id = auth.uid())
);

drop policy if exists "assignments_insert" on public.case_assignments;
create policy "assignments_insert" on public.case_assignments
for insert with check (
  has_role('ATTORNEY') or has_role('STAFF') or has_role('SUPER_USER') or has_role('SUPER_ADMIN')
);

drop policy if exists "assignments_delete" on public.case_assignments;
create policy "assignments_delete" on public.case_assignments
for delete using (has_role('SUPER_USER') or has_role('SUPER_ADMIN'));

-- checkins
drop policy if exists "checkins_read" on public.checkins;
create policy "checkins_read" on public.checkins
for select using (
  exists (select 1 from public.case_assignments ca where ca.case_id = checkins.case_id and ca.user_id = auth.uid())
  or has_role('SUPER_USER') or has_role('SUPER_ADMIN')
);

drop policy if exists "checkins_insert" on public.checkins;
create policy "checkins_insert" on public.checkins
for insert with check (
  exists (select 1 from public.case_assignments ca where ca.case_id = checkins.case_id and ca.user_id = auth.uid())
  and (has_role('CLIENT') or has_role('RN_CCM') or has_role('ATTORNEY') or has_role('STAFF') or has_role('SUPER_USER') or has_role('SUPER_ADMIN'))
);

drop policy if exists "checkins_update_self" on public.checkins;
create policy "checkins_update_self" on public.checkins
for update using (user_id = auth.uid());

-- audit_logs
drop policy if exists "audit_insert" on public.audit_logs;
create policy "audit_insert" on public.audit_logs
for insert with check (auth.uid() is not null);

drop policy if exists "audit_admin_read" on public.audit_logs;
create policy "audit_admin_read" on public.audit_logs
for select using (has_role('SUPER_USER') or has_role('SUPER_ADMIN'));