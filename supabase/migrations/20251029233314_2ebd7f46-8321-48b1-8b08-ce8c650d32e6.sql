-- Add foreign key constraints for care_plans and messages to profiles table
-- First, ensure the foreign keys point to profiles instead of auth.users

-- Drop existing foreign keys if they exist
ALTER TABLE public.care_plans DROP CONSTRAINT IF EXISTS care_plans_created_by_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_responded_by_fkey;

-- Add proper foreign keys to profiles
ALTER TABLE public.care_plans 
  ADD CONSTRAINT care_plans_created_by_fkey 
  FOREIGN KEY (created_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE public.messages 
  ADD CONSTRAINT messages_responded_by_fkey 
  FOREIGN KEY (responded_by) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;