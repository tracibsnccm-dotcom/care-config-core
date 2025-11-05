-- Add PROVIDER to app_role enum if not exists
DO $$ 
BEGIN
  ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'PROVIDER';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create provider_notes table if not exists
CREATE TABLE IF NOT EXISTS public.provider_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on provider_notes
ALTER TABLE public.provider_notes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate provider_notes policies
DROP POLICY IF EXISTS "Providers can create their own notes" ON public.provider_notes;
CREATE POLICY "Providers can create their own notes"
ON public.provider_notes
FOR INSERT
WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Providers can view their own notes" ON public.provider_notes;
CREATE POLICY "Providers can view their own notes"
ON public.provider_notes
FOR SELECT
USING (auth.uid() = provider_id);

DROP POLICY IF EXISTS "Staff can view provider notes for assigned cases" ON public.provider_notes;
CREATE POLICY "Staff can view provider notes for assigned cases"
ON public.provider_notes
FOR SELECT
USING (
  has_role('RN_CCM'::text) OR 
  has_role('ATTORNEY'::text) OR 
  has_role('STAFF'::text) OR 
  has_role('SUPER_USER'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

-- Add provider_id to client_appointments
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'client_appointments' 
    AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE public.client_appointments 
    ADD COLUMN provider_id UUID;
  END IF;
END $$;

-- Update client_appointments RLS policies
DROP POLICY IF EXISTS "Users and providers can create appointments" ON public.client_appointments;
CREATE POLICY "Users and providers can create appointments"
ON public.client_appointments
FOR INSERT
WITH CHECK (
  auth.uid() = client_id OR 
  auth.uid() = provider_id OR
  has_role('RN_CCM'::text) OR 
  has_role('ATTORNEY'::text) OR 
  has_role('STAFF'::text)
);

DROP POLICY IF EXISTS "Users and providers can view appointments" ON public.client_appointments;
CREATE POLICY "Users and providers can view appointments"
ON public.client_appointments
FOR SELECT
USING (
  auth.uid() = client_id OR 
  auth.uid() = provider_id OR
  has_role('RN_CCM'::text) OR 
  has_role('ATTORNEY'::text) OR 
  has_role('STAFF'::text) OR 
  has_role('SUPER_ADMIN'::text)
);

-- Function to handle provider appointment notifications
CREATE OR REPLACE FUNCTION public.notify_provider_appointment()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_name TEXT;
BEGIN
  -- Only process if created by a provider
  IF NEW.provider_id IS NOT NULL THEN
    -- Get provider name from profiles
    SELECT COALESCE(full_name, email) INTO v_provider_name
    FROM public.profiles
    WHERE id = NEW.provider_id;

    -- Create a case note about the appointment
    INSERT INTO public.case_notes (
      case_id,
      created_by,
      note_text,
      visibility
    ) VALUES (
      NEW.case_id,
      NEW.provider_id,
      'Provider ' || COALESCE(v_provider_name, 'Unknown') || ' scheduled appointment: ' || 
      NEW.title || ' on ' || NEW.appointment_date::text || 
      COALESCE(' at ' || NEW.appointment_time::text, ''),
      'shared'
    );

    -- Create a notification for the client
    INSERT INTO public.client_action_items (
      client_id,
      case_id,
      title,
      description,
      assigned_by,
      status,
      priority,
      due_date
    ) VALUES (
      NEW.client_id,
      NEW.case_id,
      'New Appointment Scheduled',
      'Your provider has scheduled: ' || NEW.title || ' on ' || NEW.appointment_date::text ||
      COALESCE(' at ' || NEW.appointment_time::text, '') ||
      COALESCE('. Location: ' || NEW.location, ''),
      NEW.provider_id,
      'pending',
      'high',
      NEW.appointment_date
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for provider appointments
DROP TRIGGER IF EXISTS provider_appointment_notification ON public.client_appointments;
CREATE TRIGGER provider_appointment_notification
AFTER INSERT ON public.client_appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_provider_appointment();