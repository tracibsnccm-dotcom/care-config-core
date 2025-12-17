-- RLS policies for rc_clients
-- Attorneys can only see clients linked to their cases.
-- RN CMs / supervisors can see all clients (Phase 1 simplification).

alter table rc_clients enable row level security;

-- SELECT:
-- - RN CM / Supervisor: can see all clients (within your org)
-- - Attorney: can only see clients that have a case where they are the attorney

create policy "rc_clients_select_by_role"
on rc_clients
for select
using (
  auth.uid() is not null
  and exists (
    select 1
    from rc_users u
    where u.auth_user_id = auth.uid()
      and (
        -- RN CM / Supervisor can see all clients
        u.role in ('rn_cm', 'supervisor')
        or (
          -- Attorney can only see clients with a case tied to them
          u.role = 'attorney'
          and exists (
            select 1
            from rc_cases c
            where c.client_id = rc_clients.id
              and c.attorney_id = u.id
          )
        )
      )
  )
);

-- For now: no INSERT/UPDATE/DELETE from the client side.
-- Those operations will go through controlled backend logic later.
