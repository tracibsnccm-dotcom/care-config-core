-- RLS policies for core case tables
-- Goal: Attorneys see only their cases; RN/supervisors see all org cases (Phase 1);
-- RN notes & crisis & docs are limited to case team.

-- Make sure RLS is on (already enabled in schema file but safe to repeat).
alter table rc_cases         enable row level security;
alter table rc_rn_notes      enable row level security;
alter table rc_crisis_events enable row level security;
alter table rc_documents     enable row level security;

-- Helper idea:
-- We always identify the "current rc_user" by auth.uid() -> rc_users.auth_user_id.

-- ===========================
-- rc_cases
-- ===========================

-- SELECT: 
-- - Attorneys see ONLY cases where they are the attorney_of_record (attorney_id).
-- - RN CMs and supervisors can see ALL cases (Phase 1 simplification inside your org).

create policy "rc_cases_select_by_role"
on rc_cases
for select
using (
  auth.uid() is not null
  and exists (
    select 1
    from rc_users u
    where u.auth_user_id = auth.uid()
      and (
        -- Attorney can see cases where they are the assigned attorney
        (u.role = 'attorney' and rc_cases.attorney_id = u.id)
        -- RN CM / Supervisor can see all cases (Phase 1)
        or u.role in ('rn_cm', 'supervisor')
      )
  )
);

-- For now, no direct INSERT/UPDATE/DELETE from the client on rc_cases.
-- Case creation/updates will be done through controlled backend logic later.

-- ===========================
-- rc_rn_notes
-- ===========================

-- SELECT:
-- - RN CM / Supervisor can see notes they wrote and all notes on cases they can see.
-- - Attorneys can see RN notes on their own cases.

create policy "rc_rn_notes_select_case_team"
on rc_rn_notes
for select
using (
  auth.uid() is not null
  and exists (
    select 1
    from rc_users u
    where u.auth_user_id = auth.uid()
      and (
        -- RN CM / Supervisor:
        -- can read notes on any case they can see
        (
          u.role in ('rn_cm', 'supervisor')
          and exists (
            select 1 from rc_cases c
            where c.id = rc_rn_notes.case_id
          )
        )
        -- Attorney:
        -- can read notes on their own cases
        or (
          u.role = 'attorney'
          and exists (
            select 1 from rc_cases c
            where c.id = rc_rn_notes.case_id
              and c.attorney_id = u.id
          )
        )
      )
  )
);

-- INSERT/UPDATE:
-- - Only RN CM / Supervisor can write RN notes, and only with their own rn_id.

create policy "rc_rn_notes_insert_by_rn"
on rc_rn_notes
for insert
with check (
  auth.uid() is not null
  and exists (
    select 1
    from rc_users u
    where u.auth_user_id = auth.uid()
      and u.role in ('rn_cm', 'supervisor')
      and u.id = rc_rn_notes.rn_id
  )
);

create policy "rc_rn_notes_update_by_rn"
on rc_rn_notes
for update
using (
  auth.uid() is not null
  and exists (
    select 1
    from rc_users u
    where u.auth_user_id = auth.uid()
      and u.role in ('rn_cm', 'supervisor')
      and u.id = rc_rn_notes.rn_id
  )
)
with check (
  auth.uid() is not null
  and exists (
    select 1
    from rc_users u
    where u.auth_user_id = auth.uid()
      and u.role in ('rn_cm', 'supervisor')
      and u.id = rc_rn_notes.rn_id
  )
);

-- ===========================
-- rc_crisis_events
-- ===========================

-- SELECT:
-- - RN CM / Supervisor can see crisis events on any case they can see.
-- - Attorney can see crisis events on their own cases.

create policy "rc_crisis_events_select_case_team"
on rc_crisis_events
for select
using (
  auth.uid() is not null
  and exists (
    select 1
    from rc_users u
    where u.auth_user_id = auth.uid()
      and (
        (
          u.role in ('rn_cm', 'supervisor')
          and exists (
            select 1 from rc_cases c
            where c.id = rc_crisis_events.case_id
          )
        )
        or (
          u.role = 'attorney'
          and exists (
            select 1 from rc_cases c
            where c.id = rc_crisis_events.case_id
              and c.attorney_id = u.id
          )
        )
      )
  )
);

-- INSERT:
-- - Only RN CM / Supervisor can insert crisis events.

create policy "rc_crisis_events_insert_by_rn"
on rc_crisis_events
for insert
with check (
  auth.uid() is not null
  and exists (
    select 1
    from rc_users u
    where u.auth_user_id = auth.uid()
      and u.role in ('rn_cm', 'supervisor')
      and u.id = rc_crisis_events.rn_id
  )
);

-- ===========================
-- rc_documents
-- ===========================

-- SELECT:
-- - Attorney can see docs on their cases.
-- - RN CM / Supervisor can see docs on any case they can see.

create policy "rc_documents_select_case_team"
on rc_documents
for select
using (
  auth.uid() is not null
  and exists (
    select 1
    from rc_users u
    where u.auth_user_id = auth.uid()
      and (
        (
          u.role in ('rn_cm', 'supervisor')
          and exists (
            select 1 from rc_cases c
            where c.id = rc_documents.case_id
          )
        )
        or (
          u.role = 'attorney'
          and exists (
            select 1 from rc_cases c
            where c.id = rc_documents.case_id
              and c.attorney_id = u.id
          )
        )
      )
  )
);

-- INSERT:
-- - RN CM / Supervisor / Attorney can upload docs onto cases they are linked to.
--   (We will refine this later if needed.)

create policy "rc_documents_insert_case_team"
on rc_documents
for insert
with check (
  auth.uid() is not null
  and exists (
    select 1
    from rc_users u
    where u.auth_user_id = auth.uid()
      and (
        -- RN CM / Supervisor can upload docs on any case
        (
          u.role in ('rn_cm', 'supervisor')
          and exists (
            select 1 from rc_cases c
            where c.id = rc_documents.case_id
          )
        )
        -- Attorney can upload docs on their own cases
        or (
          u.role = 'attorney'
          and exists (
            select 1 from rc_cases c
            where c.id = rc_documents.case_id
              and c.attorney_id = u.id
          )
        )
      )
  )
);
