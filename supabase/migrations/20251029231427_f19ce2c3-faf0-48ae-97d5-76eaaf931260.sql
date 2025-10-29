-- Fix handle_new_user to populate profiles.id and avoid NOT NULL violation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile row for the new user
  INSERT INTO public.profiles (id, user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    split_part(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.email, ''), '@', 1)
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Ensure default CLIENT role exists for new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'CLIENT'::app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;