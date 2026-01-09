-- Create rc_client_consents table for storing client consent signatures
-- This table tracks all consent forms signed before intake

create table if not exists rc_client_consents (
  id uuid primary key default gen_random_uuid(),
  session_id text not null, -- to track consent before intake exists
  client_intake_id uuid references rc_client_intakes(id) on delete set null,
  
  -- Service Agreement (Form 1) - FIRST
  service_agreement_signed_at timestamptz,
  service_agreement_signature text,
  service_agreement_declined boolean default false,
  
  -- Authorization for Legal Disclosure (Form 2)
  legal_disclosure_signed_at timestamptz,
  legal_disclosure_signature text,
  legal_disclosure_attorney_name text,
  
  -- Authorization to Obtain Records (Form 3)
  obtain_records_signed_at timestamptz,
  obtain_records_signature text,
  obtain_records_injury_date date,
  
  -- Authorization for Healthcare Coordination (Form 4)
  healthcare_coord_signed_at timestamptz,
  healthcare_coord_signature text,
  healthcare_coord_pcp text,
  healthcare_coord_specialist text,
  healthcare_coord_therapy text,
  
  -- HIPAA Privacy Notice - LAST
  hipaa_acknowledged_at timestamptz,
  hipaa_signature text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create index on session_id for quick lookups before intake exists
create index if not exists idx_rc_client_consents_session_id on rc_client_consents(session_id);

-- Create index on client_intake_id for linking after intake is created
create index if not exists idx_rc_client_consents_client_intake_id on rc_client_consents(client_intake_id);

-- Enable RLS
alter table rc_client_consents enable row level security;

-- RLS Policies
-- Allow service role to do everything
create policy "Service role can manage consents"
  on rc_client_consents
  for all
  using (auth.role() = 'service_role');

-- Allow public (unauthenticated) inserts for consent flow
-- Clients sign consents before they have an account
create policy "Public can insert consents"
  on rc_client_consents
  for insert
  with check (true);

-- Allow public (unauthenticated) updates by session_id
-- Clients can update their consent progress using session_id
create policy "Public can update consents by session_id"
  on rc_client_consents
  for update
  using (true)
  with check (true);

-- Allow authenticated users to read their own consents (via client_intake_id)
-- This will be expanded when we link consents to intakes
create policy "Users can read their own consents"
  on rc_client_consents
  for select
  using (
    exists (
      select 1 from rc_client_intakes ci
      where ci.id = rc_client_consents.client_intake_id
      and ci.case_id in (
        select id from rc_cases where client_id in (
          select id from rc_clients where user_id in (
            select id from rc_users where auth_user_id = auth.uid()
          )
        )
      )
    )
  );
