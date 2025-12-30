-- Create role enum matching RCMS roles
create type public.app_role as enum ('CLIENT', 'ATTORNEY', 'PROVIDER', 'RN_CCM', 'SUPER_USER', 'SUPER_ADMIN');

-- Create profiles table for basic user info
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create user_roles table (CRITICAL: roles in separate table for security)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz default now(),
  unique (user_id, role)
);

-- Create case_access table (which users can access which cases - tokenized, no PHI)
create table public.case_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  case_id text not null,
  granted_at timestamptz default now(),
  granted_by uuid references auth.users(id),
  unique (user_id, case_id)
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.case_access enable row level security;

-- Security definer function to check roles (prevents RLS recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

-- Function to get all user roles
create or replace function public.get_user_roles(_user_id uuid)
returns setof app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.user_roles
  where user_id = _user_id
$$;

-- RLS Policies for profiles
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Service role can insert profiles"
  on public.profiles for insert
  with check (true);

-- RLS Policies for user_roles
create policy "Users can view their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'SUPER_ADMIN'));

create policy "Admins can manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- RLS Policies for case_access
create policy "Users can view their own case access"
  on public.case_access for select
  using (auth.uid() = user_id);

create policy "Attorneys can view case access for their cases"
  on public.case_access for select
  using (
    public.has_role(auth.uid(), 'ATTORNEY') and
    exists (
      select 1 from public.case_access ca
      where ca.user_id = auth.uid()
      and ca.case_id = case_access.case_id
    )
  );

create policy "Admins can manage case access"
  on public.case_access for all
  using (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();