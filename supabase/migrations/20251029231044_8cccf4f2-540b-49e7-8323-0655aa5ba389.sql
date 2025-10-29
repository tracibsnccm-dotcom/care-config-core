-- Add unique constraint on profiles.user_id to support ON CONFLICT
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);