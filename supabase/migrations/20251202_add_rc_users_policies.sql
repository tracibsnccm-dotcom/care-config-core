-- RLS policies for rc_users
-- Each logged-in auth user should only see/update their own rc_users row.

-- First, just to be sure RLS is on (it already is, but this is safe/idempotent):
alter table rc_users enable row level security;

-- Allow a logged-in user to SELECT only their own rc_users row
create policy "rc_users_select_own_row"
on rc_users
for select
using (
  auth.uid() is not null
  and auth_user_id = auth.uid()
);

-- Allow a logged-in user to UPDATE only their own rc_users row
create policy "rc_users_update_own_row"
on rc_users
for update
using (
  auth.uid() is not null
  and auth_user_id = auth.uid()
)
with check (
  auth.uid() is not null
  and auth_user_id = auth.uid()
);

-- For now, we will NOT allow direct INSERT or DELETE from the client.
-- Inserts will be done by privileged backend logic (service role) later.
