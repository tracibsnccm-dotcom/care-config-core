-- Add missing columns to documents table for enhanced document management
ALTER TABLE public.documents
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'archived')),
ADD COLUMN IF NOT EXISTS read_by uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS requires_attention boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_case_id ON public.documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_requires_attention ON public.documents(requires_attention);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION update_documents_updated_at();

-- Add RLS policy for updating read_by array
CREATE POLICY "Users can mark documents as read" 
ON public.documents 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM case_assignments ca
    WHERE ca.case_id = documents.case_id 
    AND ca.user_id = auth.uid()
  )
);