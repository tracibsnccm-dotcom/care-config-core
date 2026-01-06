-- Add released_by_rn_id field to track which RN user released the case
-- This references the auth user ID (from auth.users) who released the case

ALTER TABLE rc_cases
ADD COLUMN IF NOT EXISTS released_by_rn_id uuid;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_rc_cases_released_by_rn_id ON rc_cases(released_by_rn_id);

-- Add comment
COMMENT ON COLUMN rc_cases.released_by_rn_id IS 'Auth user ID (from auth.users) of the RN user who released this case to attorneys.';
