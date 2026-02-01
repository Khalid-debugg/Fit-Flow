-- UP
-- Add cloud backup settings columns to settings table
ALTER TABLE settings ADD COLUMN cloud_backup_enabled INTEGER NOT NULL DEFAULT 0 CHECK (cloud_backup_enabled IN (0, 1));
ALTER TABLE settings ADD COLUMN cloud_backup_api_url TEXT;
ALTER TABLE settings ADD COLUMN last_cloud_backup_date DATETIME;

-- DOWN
-- Remove cloud backup settings columns from settings table
ALTER TABLE settings DROP COLUMN cloud_backup_enabled;
ALTER TABLE settings DROP COLUMN cloud_backup_api_url;
ALTER TABLE settings DROP COLUMN last_cloud_backup_date;
