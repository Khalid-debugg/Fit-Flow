-- Add is_paused column to memberships table
ALTER TABLE memberships ADD COLUMN is_paused INTEGER DEFAULT 0 CHECK (is_paused IN (0, 1));

-- Add paused_date column to track when membership was paused
ALTER TABLE memberships ADD COLUMN paused_date DATE;

-- Add original_end_date column to track original end date before pause
ALTER TABLE memberships ADD COLUMN original_end_date DATE;

-- Create index for paused memberships
CREATE INDEX IF NOT EXISTS idx_memberships_is_paused ON memberships(is_paused);
