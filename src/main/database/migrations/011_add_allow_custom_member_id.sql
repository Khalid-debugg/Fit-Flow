-- UP
-- Add allow_custom_member_id column to settings table
ALTER TABLE settings ADD COLUMN allow_custom_member_id INTEGER NOT NULL DEFAULT 0 CHECK (allow_custom_member_id IN (0, 1));

-- DOWN
-- Remove allow_custom_member_id column from settings table
ALTER TABLE settings DROP COLUMN allow_custom_member_id;
