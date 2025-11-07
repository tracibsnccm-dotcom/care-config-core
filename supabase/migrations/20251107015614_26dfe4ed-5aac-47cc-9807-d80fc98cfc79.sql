-- Fix scenario creation failing: add explicit INSERT policy for test_scenarios
-- Keep existing permissive authenticated access model consistent with current policies

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.test_scenarios ENABLE ROW LEVEL SECURITY;

-- Create INSERT policy if it does not already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' 
      AND tablename='test_scenarios' 
      AND policyname='Authenticated can insert scenarios'
  ) THEN
    CREATE POLICY "Authenticated can insert scenarios"
    ON public.test_scenarios
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END
$$;
