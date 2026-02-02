-- Add fields for tracking pause duration and remaining days
ALTER TABLE memberships ADD COLUMN pause_duration_days INTEGER;
ALTER TABLE memberships ADD COLUMN remaining_days_before_pause INTEGER;
