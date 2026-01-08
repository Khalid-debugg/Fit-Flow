-- UP
-- Add allow_instant_checkin column to settings table
ALTER TABLE settings ADD COLUMN allow_instant_checkin INTEGER NOT NULL DEFAULT 0 CHECK (allow_instant_checkin IN (0, 1));

-- DOWN
-- Remove allow_instant_checkin column from settings table
ALTER TABLE settings DROP COLUMN allow_instant_checkin;
