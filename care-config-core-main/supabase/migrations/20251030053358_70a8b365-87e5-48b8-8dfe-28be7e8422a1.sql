-- Table for pinned cases per user
CREATE TABLE public.pinned_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, case_id)
);

-- RLS policies for pinned_cases
ALTER TABLE public.pinned_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pinned cases"
ON public.pinned_cases FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pinned cases"
ON public.pinned_cases FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pinned cases"
ON public.pinned_cases FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pinned cases"
ON public.pinned_cases FOR DELETE
USING (auth.uid() = user_id);

-- Table for message drafts
CREATE TABLE public.message_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID,
  context TEXT NOT NULL,
  draft_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, case_id, context)
);

-- RLS policies for message_drafts
ALTER TABLE public.message_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own drafts"
ON public.message_drafts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own drafts"
ON public.message_drafts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
ON public.message_drafts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
ON public.message_drafts FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update updated_at on message_drafts
CREATE OR REPLACE FUNCTION update_message_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_message_drafts_updated_at
BEFORE UPDATE ON public.message_drafts
FOR EACH ROW
EXECUTE FUNCTION update_message_drafts_updated_at();

-- Table for user preferences (includes notification filters and theme)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_filter TEXT DEFAULT 'all',
  theme TEXT DEFAULT 'light',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS policies for user_preferences
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger to update updated_at on user_preferences
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_message_drafts_updated_at();

-- Indexes for performance
CREATE INDEX idx_pinned_cases_user_position ON public.pinned_cases(user_id, position);
CREATE INDEX idx_message_drafts_user_context ON public.message_drafts(user_id, context);
CREATE INDEX idx_user_preferences_user ON public.user_preferences(user_id);