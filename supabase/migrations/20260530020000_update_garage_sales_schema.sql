-- Add neighborhood column
ALTER TABLE garage_sales ADD COLUMN IF NOT EXISTS neighborhood TEXT NOT NULL DEFAULT '';

-- Drop photos array column
ALTER TABLE garage_sales DROP COLUMN IF EXISTS photos;
