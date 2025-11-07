-- Enable RLS and add permissive policies for testing tools
-- Scenarios
ALTER TABLE public.test_scenarios ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='test_scenarios' AND policyname='Authenticated can select scenarios'
  ) THEN
    CREATE POLICY "Authenticated can select scenarios"
    ON public.test_scenarios
    FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='test_scenarios' AND policyname='Authenticated can insert scenarios'
  ) THEN
    CREATE POLICY "Authenticated can insert scenarios"
    ON public.test_scenarios
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='test_scenarios' AND policyname='Authenticated can delete scenarios'
  ) THEN
    CREATE POLICY "Authenticated can delete scenarios"
    ON public.test_scenarios
    FOR DELETE
    USING (auth.role() = 'authenticated');
  END IF;
END
$$;

-- Test events (for logging)
ALTER TABLE public.test_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='test_events' AND policyname='Authenticated can insert test events'
  ) THEN
    CREATE POLICY "Authenticated can insert test events"
    ON public.test_events
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='test_events' AND policyname='Authenticated can select test events'
  ) THEN
    CREATE POLICY "Authenticated can select test events"
    ON public.test_events
    FOR SELECT
    USING (auth.role() = 'authenticated');
  END IF;
END
$$;