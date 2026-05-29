-- Add latitude and longitude columns to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Backfill default coordinates for zip_code '90210' (Beverly Hills coordinates: lat 34.0901, lon -118.4065)
UPDATE listings SET latitude = 34.0901, longitude = -118.4065 WHERE zip_code = '90210' AND latitude IS NULL;
