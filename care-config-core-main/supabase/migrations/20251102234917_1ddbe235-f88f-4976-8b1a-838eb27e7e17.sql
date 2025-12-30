-- Create user_preferences table if not exists
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  sms_notifications BOOLEAN NOT NULL DEFAULT false,
  assignment_alerts BOOLEAN NOT NULL DEFAULT true,
  case_updates BOOLEAN NOT NULL DEFAULT true,
  document_alerts BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;

-- Create policies
CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_preferences_updated_at'
  ) THEN
    CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Create attorney_availability table
CREATE TABLE IF NOT EXISTS public.attorney_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  available_monday BOOLEAN NOT NULL DEFAULT true,
  available_tuesday BOOLEAN NOT NULL DEFAULT true,
  available_wednesday BOOLEAN NOT NULL DEFAULT true,
  available_thursday BOOLEAN NOT NULL DEFAULT true,
  available_friday BOOLEAN NOT NULL DEFAULT true,
  available_saturday BOOLEAN NOT NULL DEFAULT false,
  available_sunday BOOLEAN NOT NULL DEFAULT false,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attorney_availability ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Attorneys can view own availability"
ON public.attorney_availability
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Attorneys can update own availability"
ON public.attorney_availability
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Attorneys can insert own availability"
ON public.attorney_availability
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create trigger
CREATE TRIGGER update_attorney_availability_updated_at
BEFORE UPDATE ON public.attorney_availability
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create practice_areas table
CREATE TABLE IF NOT EXISTS public.practice_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practice_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practice areas viewable by authenticated users"
ON public.practice_areas
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Insert common practice areas
INSERT INTO public.practice_areas (name, description) VALUES
  ('Personal Injury', 'Car accidents, slip and fall, medical malpractice'),
  ('Workers Compensation', 'Workplace injuries and occupational diseases'),
  ('Medical Malpractice', 'Healthcare provider negligence'),
  ('Product Liability', 'Defective product injuries'),
  ('Wrongful Death', 'Fatal accident claims'),
  ('Brain Injury', 'Traumatic brain injury cases'),
  ('Spinal Cord Injury', 'Paralysis and spinal trauma'),
  ('Burn Injury', 'Severe burn and scarring cases'),
  ('Nursing Home Abuse', 'Elder abuse and neglect'),
  ('Motor Vehicle Accidents', 'Car, truck, and motorcycle accidents')
ON CONFLICT (name) DO NOTHING;

-- Create attorney_practice_areas junction table
CREATE TABLE IF NOT EXISTS public.attorney_practice_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  attorney_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  practice_area_id UUID NOT NULL REFERENCES public.practice_areas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(attorney_id, practice_area_id)
);

-- Enable RLS
ALTER TABLE public.attorney_practice_areas ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Attorneys can view own practice areas"
ON public.attorney_practice_areas
FOR SELECT
USING (auth.uid() = attorney_id);

CREATE POLICY "Attorneys can insert own practice areas"
ON public.attorney_practice_areas
FOR INSERT
WITH CHECK (auth.uid() = attorney_id);

CREATE POLICY "Attorneys can delete own practice areas"
ON public.attorney_practice_areas
FOR DELETE
USING (auth.uid() = attorney_id);

CREATE POLICY "Staff can view all practice areas"
ON public.attorney_practice_areas
FOR SELECT
USING (has_role('STAFF') OR has_role('RN_CCM') OR has_role('SUPER_ADMIN'));