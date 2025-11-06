-- Create storage bucket for management resources
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'management-resources',
  'management-resources',
  true,
  20971520, -- 20MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
);

-- RLS Policies for management-resources bucket

-- Allow staff to upload files
CREATE POLICY "Staff can upload resource files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'management-resources' 
  AND (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('RN_CCM', 'STAFF', 'SUPER_ADMIN')
  ))
);

-- Allow authenticated users to view files (public bucket)
CREATE POLICY "Anyone can view resource files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'management-resources');

-- Allow staff to update their uploaded files
CREATE POLICY "Staff can update resource files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'management-resources'
  AND (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('STAFF', 'SUPER_ADMIN')
  ))
);

-- Allow staff to delete files
CREATE POLICY "Staff can delete resource files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'management-resources'
  AND (EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('STAFF', 'SUPER_ADMIN')
  ))
);