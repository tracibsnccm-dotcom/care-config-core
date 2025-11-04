-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create storage bucket for diary attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'diary-attachments',
  'diary-attachments',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Add attachment support to diary entries
ALTER TABLE rn_diary_entries
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Storage policies for diary attachments
CREATE POLICY "RN CMs can upload diary attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'diary-attachments' AND
  (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'RN_CCM'
  ))
);

CREATE POLICY "RN CMs can view diary attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'diary-attachments' AND
  (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role IN ('RN_CCM', 'SUPER_ADMIN')
  ))
);

CREATE POLICY "RN CMs can update their diary attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'diary-attachments' AND
  (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'RN_CCM'
  ))
);

CREATE POLICY "RN CMs can delete their diary attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'diary-attachments' AND
  (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'RN_CCM'
  ))
);