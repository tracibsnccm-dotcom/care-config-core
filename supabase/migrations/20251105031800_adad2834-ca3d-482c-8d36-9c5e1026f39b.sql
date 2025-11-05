-- Provider Ratings & Reviews
CREATE TABLE public.provider_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.client_appointments(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can create their own ratings"
  ON public.provider_ratings FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can view their own ratings"
  ON public.provider_ratings FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Providers can view their ratings"
  ON public.provider_ratings FOR SELECT
  USING (auth.uid() = provider_id);

CREATE POLICY "RN CM can view all ratings"
  ON public.provider_ratings FOR SELECT
  USING (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE INDEX idx_provider_ratings_provider ON public.provider_ratings(provider_id);
CREATE INDEX idx_provider_ratings_client ON public.provider_ratings(client_id);

-- Appointment Notes (provider's post-visit notes)
CREATE TABLE public.appointment_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.client_appointments(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  clinical_notes TEXT NOT NULL,
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can manage their appointment notes"
  ON public.appointment_notes FOR ALL
  USING (auth.uid() = provider_id);

CREATE POLICY "RN CM can view appointment notes"
  ON public.appointment_notes FOR SELECT
  USING (has_role('RN_CCM') OR has_role('RN_CCM_DIRECTOR') OR has_role('SUPER_ADMIN'));

CREATE POLICY "Attorneys can view appointment notes for their cases"
  ON public.appointment_notes FOR SELECT
  USING (
    has_role('ATTORNEY') AND 
    EXISTS (
      SELECT 1 FROM public.case_assignments 
      WHERE case_id = appointment_notes.case_id 
      AND user_id = auth.uid()
    )
  );

CREATE INDEX idx_appointment_notes_appointment ON public.appointment_notes(appointment_id);
CREATE INDEX idx_appointment_notes_case ON public.appointment_notes(case_id);

-- Provider-RN Messages
CREATE TABLE public.provider_rn_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_rn_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send messages"
  ON public.provider_rn_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their messages"
  ON public.provider_rn_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can mark messages as read"
  ON public.provider_rn_messages FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE INDEX idx_provider_rn_messages_case ON public.provider_rn_messages(case_id);
CREATE INDEX idx_provider_rn_messages_recipient ON public.provider_rn_messages(recipient_id, read_at);

-- Add cancellation policy to client_appointments
ALTER TABLE public.client_appointments 
  ADD COLUMN cancellation_deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN cancellation_policy_hours INTEGER DEFAULT 24,
  ADD COLUMN cancelled_by UUID REFERENCES auth.users(id),
  ADD COLUMN cancellation_reason TEXT;

-- Trigger to set cancellation deadline
CREATE OR REPLACE FUNCTION set_cancellation_deadline()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cancellation_deadline := (NEW.appointment_date + NEW.appointment_time) - 
    (COALESCE(NEW.cancellation_policy_hours, 24) || ' hours')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_appointment_cancellation_deadline
  BEFORE INSERT OR UPDATE ON public.client_appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_cancellation_deadline();

-- Update trigger for timestamps
CREATE TRIGGER update_provider_ratings_updated_at
  BEFORE UPDATE ON public.provider_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointment_notes_updated_at
  BEFORE UPDATE ON public.appointment_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();