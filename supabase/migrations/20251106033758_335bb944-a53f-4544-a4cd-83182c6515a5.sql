-- Create test scenarios table
CREATE TABLE IF NOT EXISTS public.test_scenarios (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_profile TEXT NOT NULL,
  core_pattern TEXT NOT NULL,
  attorney_status TEXT NOT NULL,
  timeline JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_scenarios ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view scenarios
CREATE POLICY "Scenarios viewable by authenticated"
  ON public.test_scenarios FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can manage scenarios  
CREATE POLICY "Authenticated can manage scenarios"
  ON public.test_scenarios FOR ALL
  USING (auth.role() = 'authenticated');

-- Create simulated time table
CREATE TABLE IF NOT EXISTS public.simulated_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sim_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simulated_time ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view simulated time
CREATE POLICY "Simulated time viewable by authenticated"
  ON public.simulated_time FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can manage simulated time
CREATE POLICY "Authenticated can manage simulated time"
  ON public.simulated_time FOR ALL
  USING (auth.role() = 'authenticated');

-- Create test events table
CREATE TABLE IF NOT EXISTS public.test_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id TEXT REFERENCES public.test_scenarios(id),
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_events ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view events
CREATE POLICY "Events viewable by authenticated"
  ON public.test_events FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can create events
CREATE POLICY "Authenticated users can create events"
  ON public.test_events FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can delete events
CREATE POLICY "Authenticated can delete events"
  ON public.test_events FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create test user accounts table (for admin-created test accounts)
CREATE TABLE IF NOT EXISTS public.test_user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  password TEXT NOT NULL,
  user_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.test_user_accounts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view test accounts
CREATE POLICY "Authenticated can view test accounts"
  ON public.test_user_accounts FOR SELECT
  USING (auth.role() = 'authenticated');

-- All authenticated users can manage test accounts
CREATE POLICY "Authenticated can manage test accounts"
  ON public.test_user_accounts FOR ALL
  USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for simulated_time
DROP TRIGGER IF EXISTS update_simulated_time_updated_at ON public.simulated_time;
CREATE TRIGGER update_simulated_time_updated_at
  BEFORE UPDATE ON public.simulated_time
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();