-- Add PDF URL and generation timestamp columns to rc_care_plans table
-- For tracking generated PDF documents

-- Add columns if rc_care_plans table exists
DO $$ 
BEGIN
  -- Check if rc_care_plans table exists
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'rc_care_plans') THEN
    
    -- Add pdf_url column
    ALTER TABLE public.rc_care_plans 
    ADD COLUMN IF NOT EXISTS pdf_url TEXT;
    
    -- Add pdf_generated_at column
    ALTER TABLE public.rc_care_plans 
    ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;
    
    -- Add index for querying by pdf_generated_at
    CREATE INDEX IF NOT EXISTS idx_rc_care_plans_pdf_generated_at 
    ON public.rc_care_plans(pdf_generated_at);
    
  END IF;
END $$;

-- Also add to care_plans table if it exists (for backward compatibility)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name = 'care_plans') THEN
    
    ALTER TABLE public.care_plans 
    ADD COLUMN IF NOT EXISTS pdf_url TEXT;
    
    ALTER TABLE public.care_plans 
    ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;
    
    CREATE INDEX IF NOT EXISTS idx_care_plans_pdf_generated_at 
    ON public.care_plans(pdf_generated_at);
    
  END IF;
END $$;
