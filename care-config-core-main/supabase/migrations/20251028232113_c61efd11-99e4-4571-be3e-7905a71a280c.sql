-- ===========================
-- RCMS C.A.R.E. — Auth helpers
-- Auto-profile creation, default CLIENT role,
-- and a one-time SUPER_ADMIN grant.
-- ===========================

-- 1) Profile autogen on new auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- create profile
  INSERT INTO public.profiles(user_id, email, display_name)
  VALUES (new.id, new.email, split_part(coalesce(new.raw_user_meta_data->>'full_name', new.email,''),'@',1))
  ON CONFLICT (user_id) DO NOTHING;

  -- give default CLIENT role
  INSERT INTO public.user_roles(user_id, role)
  VALUES (new.id, 'CLIENT')
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();