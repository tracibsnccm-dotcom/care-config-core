-- Add foreign key constraints (Batch 1: Core tables)
-- This ensures data integrity and prevents orphaned records

-- Attorney wallet (already cleaned orphaned data)
ALTER TABLE public.attorney_wallet
  ADD CONSTRAINT fk_attorney_wallet_attorney 
  FOREIGN KEY (attorney_id) REFERENCES public.attorney_metadata(user_id) ON DELETE CASCADE;

-- Attorney availability
ALTER TABLE public.attorney_availability
  ADD CONSTRAINT fk_attorney_availability_user 
  FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Attorney monthly reports
ALTER TABLE public.attorney_monthly_reports
  ADD CONSTRAINT fk_attorney_monthly_reports_attorney 
  FOREIGN KEY (attorney_id) REFERENCES public.attorney_metadata(user_id) ON DELETE CASCADE;

-- Attorney practice areas
ALTER TABLE public.attorney_practice_areas
  ADD CONSTRAINT fk_attorney_practice_areas_attorney 
  FOREIGN KEY (attorney_id) REFERENCES public.attorney_metadata(user_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_attorney_practice_areas_practice_area 
  FOREIGN KEY (practice_area_id) REFERENCES public.practice_areas(id) ON DELETE CASCADE;

-- Audit events
ALTER TABLE public.audit_events
  ADD CONSTRAINT fk_audit_events_actor 
  FOREIGN KEY (actor_user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;