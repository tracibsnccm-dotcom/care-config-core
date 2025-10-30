-- Table for message reminders
CREATE TABLE public.message_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID NOT NULL,
  case_id UUID,
  remind_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reminded BOOLEAN NOT NULL DEFAULT false,
  reminded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies for message_reminders
ALTER TABLE public.message_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
ON public.message_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
ON public.message_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON public.message_reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON public.message_reminders FOR DELETE
USING (auth.uid() = user_id);

-- Update user_preferences to include nav_collapsed and dismissed_tips
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS nav_collapsed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dismissed_tips JSONB DEFAULT '[]'::jsonb;

-- Indexes for performance
CREATE INDEX idx_message_reminders_user_reminded ON public.message_reminders(user_id, reminded);
CREATE INDEX idx_message_reminders_remind_at ON public.message_reminders(remind_at) WHERE reminded = false;