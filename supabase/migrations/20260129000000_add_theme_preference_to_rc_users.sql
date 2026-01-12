-- Add theme_preference column to rc_users table for RN Portal theme customization
ALTER TABLE rc_users 
ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'boldModern';

-- Add comment to document the column
COMMENT ON COLUMN rc_users.theme_preference IS 'User theme preference for RN Portal (default: boldModern). Valid values: boldModern, warmEnergizing, freshVibrant, sophisticatedWarm, natureInspired, oceanDusk';
