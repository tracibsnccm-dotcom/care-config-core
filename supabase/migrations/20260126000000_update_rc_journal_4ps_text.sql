-- Update rc_journal table to add text fields for 4Ps sections
-- This migration adds separate text fields for each P section while keeping the boolean flags

ALTER TABLE public.rc_journal
  ADD COLUMN IF NOT EXISTS p1_physical_text text,
  ADD COLUMN IF NOT EXISTS p2_psychological_text text,
  ADD COLUMN IF NOT EXISTS p3_psychosocial_text text,
  ADD COLUMN IF NOT EXISTS p4_professional_text text;

-- The content field will be used for general entry
-- Boolean flags (p1_physical, p2_psychological, etc.) can remain for backward compatibility
-- but the new text fields allow detailed entries per P section
