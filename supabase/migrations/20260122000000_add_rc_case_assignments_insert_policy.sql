-- Migration: Allow insert to rc_case_assignments
-- This migration adds an RLS policy to allow inserts to rc_case_assignments table
-- The policy allows any authenticated user to insert records (used for system operations)

-- Enable RLS on rc_case_assignments if not already enabled
ALTER TABLE public.rc_case_assignments ENABLE ROW LEVEL SECURITY;

-- Drop policy if it already exists (idempotent)
DROP POLICY IF EXISTS "Allow insert to rc_case_assignments" ON public.rc_case_assignments;

-- Create policy to allow inserts
CREATE POLICY "Allow insert to rc_case_assignments" 
ON public.rc_case_assignments 
FOR INSERT 
WITH CHECK (true);
