-- Add PROVIDER to app_role enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'PROVIDER'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'PROVIDER';
  END IF;
END $$;

-- Add provider_id to client_appointments if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'client_appointments' 
    AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE public.client_appointments 
    ADD COLUMN provider_id UUID;
  END IF;
END $$;

-- Update RLS policies for client_appointments
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
    -- Get provider name
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