-- Add SMS notification preferences to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS sms_notifications_enabled BOOLEAN DEFAULT false;

-- Create SMS notification log table
CREATE TABLE IF NOT EXISTS sms_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  entry_id UUID REFERENCES rn_diary_entries(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE sms_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own SMS notifications"
ON sms_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert SMS notifications"
ON sms_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "System can update SMS notifications"
ON sms_notifications FOR UPDATE
TO authenticated
USING (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_sms_notifications_user_id ON sms_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_status ON sms_notifications(status);
CREATE INDEX IF NOT EXISTS idx_sms_notifications_created_at ON sms_notifications(created_at DESC);