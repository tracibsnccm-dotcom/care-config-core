-- Link Supabase Auth users to rc_users
-- Whenever a new auth.users row is created, create a matching rc_users row.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Default role: 'attorney' for now.
  -- We can manually change role later for RN CMs, supervisors, providers, etc.
  insert into public.rc_users (auth_user_id, role, full_name)
  values (
    new.id,
    'attorney',
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

-- Trigger: runs after a new auth user is created
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();
