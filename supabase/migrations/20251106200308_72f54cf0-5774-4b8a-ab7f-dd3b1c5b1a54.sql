-- Add foreign key constraints (Batch 2: Appointments & Assignments)

-- Appointment document shares
ALTER TABLE public.appointment_document_shares
  ADD CONSTRAINT fk_appointment_document_shares_appointment 
  FOREIGN KEY (appointment_id) REFERENCES public.client_appointments(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_appointment_document_shares_case 
  FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_appointment_document_shares_client 
  FOREIGN KEY (client_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_appointment_document_shares_provider 
  FOREIGN KEY (provider_id) REFERENCES public.providers(id) ON DELETE CASCADE;

-- Appointment notes
ALTER TABLE public.appointment_notes
  ADD CONSTRAINT fk_appointment_notes_appointment 
  FOREIGN KEY (appointment_id) REFERENCES public.client_appointments(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_appointment_notes_case 
  FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_appointment_notes_provider 
  FOREIGN KEY (provider_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Assignment audit log
ALTER TABLE public.assignment_audit_log
  ADD CONSTRAINT fk_assignment_audit_log_case 
  FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_assignment_audit_log_attorney 
  FOREIGN KEY (assigned_attorney_id) REFERENCES public.attorney_metadata(user_id) ON DELETE SET NULL;

-- Assignment offers
ALTER TABLE public.assignment_offers
  ADD CONSTRAINT fk_assignment_offers_case 
  FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_assignment_offers_attorney 
  FOREIGN KEY (attorney_id) REFERENCES public.attorney_metadata(user_id) ON DELETE CASCADE;

-- Attorney RN messages
ALTER TABLE public.attorney_rn_messages
  ADD CONSTRAINT fk_attorney_rn_messages_case 
  FOREIGN KEY (case_id) REFERENCES public.cases(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_attorney_rn_messages_sender 
  FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;