-- Fix infinite recursion in case_access RLS policy
-- case_id in case_access is TEXT, case_id in case_assignments is UUID

-- Drop the problematic policy
DROP POLICY IF EXISTS "Attorneys can view case access for their cases" ON public.case_access;

-- Create a security definer function to check if user has case access
-- Accepts TEXT case_id to match case_access table
CREATE OR REPLACE FUNCTION public.user_has_case_access(_user_id uuid, _case_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.case_assignments
    WHERE user_id = _user_id AND case_id::text = _case_id
  );
$$;

-- Recreate the policy using the security definer function (no recursion)
CREATE POLICY "Attorneys can view case access for their cases"
  ON public.case_access
  FOR SELECT
  USING (
    has_role(auth.uid(), 'ATTORNEY') 
    AND user_has_case_access(auth.uid(), case_id)
  );