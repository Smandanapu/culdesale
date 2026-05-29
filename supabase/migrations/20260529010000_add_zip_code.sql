-- Add zip_code column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Backfill any existing listings with a default ZIP code to maintain consistency
UPDATE listings SET zip_code = '90210' WHERE zip_code IS NULL;

-- Index for faster filtering and searching by ZIP code
CREATE INDEX IF NOT EXISTS idx_listings_zip_code ON listings(zip_code);
