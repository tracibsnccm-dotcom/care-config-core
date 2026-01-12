CREATE TABLE IF NOT EXISTS rc_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES rc_cases(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'rn')),
  sender_id UUID,
  sender_name TEXT,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rc_messages_case_id ON rc_messages(case_id);
CREATE INDEX IF NOT EXISTS idx_rc_messages_created_at ON rc_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_rc_messages_is_read ON rc_messages(is_read);

ALTER TABLE rc_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations for rc_messages" ON rc_messages;
CREATE POLICY "Allow all operations for rc_messages" ON rc_messages
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON rc_messages TO anon;
GRANT ALL ON rc_messages TO authenticated;