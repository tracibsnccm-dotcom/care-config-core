-- Create client goals table
CREATE TABLE IF NOT EXISTS public.client_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL,
  goal_text TEXT NOT NULL,
  category TEXT NOT NULL,
  target_date DATE,
  current_progress INTEGER DEFAULT 0 CHECK (current_progress >= 0 AND current_progress <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client medications table
CREATE TABLE IF NOT EXISTS public.client_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  prescribing_doctor TEXT,
  start_date DATE,
  end_date DATE,
  side_effects TEXT,
  adherence_notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client action items table
CREATE TABLE IF NOT EXISTS public.client_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_by UUID REFERENCES auth.users(id),
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client appointments table
CREATE TABLE IF NOT EXISTS public.client_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL,
  title TEXT NOT NULL,
  provider_name TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME,
  location TEXT,
  notes TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show')),
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create client direct messages table
CREATE TABLE IF NOT EXISTS public.client_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL CHECK (LENGTH(message_text) <= 5000),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_goals
CREATE POLICY "Users can view their own goals"
  ON public.client_goals FOR SELECT
  USING (auth.uid() = client_id OR has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF'));

CREATE POLICY "Users can create their own goals"
  ON public.client_goals FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own goals"
  ON public.client_goals FOR UPDATE
  USING (auth.uid() = client_id OR has_role('RN_CCM') OR has_role('ATTORNEY'));

-- RLS Policies for client_medications
CREATE POLICY "Users can view their own medications"
  ON public.client_medications FOR SELECT
  USING (auth.uid() = client_id OR has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF'));

CREATE POLICY "Users can create their own medications"
  ON public.client_medications FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update their own medications"
  ON public.client_medications FOR UPDATE
  USING (auth.uid() = client_id OR has_role('RN_CCM') OR has_role('ATTORNEY'));

-- RLS Policies for client_action_items
CREATE POLICY "Users can view their own action items"
  ON public.client_action_items FOR SELECT
  USING (auth.uid() = client_id OR has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF'));

CREATE POLICY "Staff can create action items"
  ON public.client_action_items FOR INSERT
  WITH CHECK (has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF') OR auth.uid() = client_id);

CREATE POLICY "Users can update their own action items"
  ON public.client_action_items FOR UPDATE
  USING (auth.uid() = client_id OR has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF'));

-- RLS Policies for client_appointments
CREATE POLICY "Users can view their own appointments"
  ON public.client_appointments FOR SELECT
  USING (auth.uid() = client_id OR has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF'));

CREATE POLICY "Users can create their own appointments"
  ON public.client_appointments FOR INSERT
  WITH CHECK (auth.uid() = client_id OR has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF'));

CREATE POLICY "Users can update their own appointments"
  ON public.client_appointments FOR UPDATE
  USING (auth.uid() = client_id OR has_role('RN_CCM') OR has_role('ATTORNEY') OR has_role('STAFF'));

-- RLS Policies for client_direct_messages
CREATE POLICY "Users can view messages they sent or received"
  ON public.client_direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON public.client_direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages as read"
  ON public.client_direct_messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Triggers for updated_at
CREATE TRIGGER update_client_goals_updated_at
  BEFORE UPDATE ON public.client_goals
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_client_medications_updated_at
  BEFORE UPDATE ON public.client_medications
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_client_action_items_updated_at
  BEFORE UPDATE ON public.client_action_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_client_appointments_updated_at
  BEFORE UPDATE ON public.client_appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();