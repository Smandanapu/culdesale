-- Rename sale_date to start_date
ALTER TABLE garage_sales RENAME COLUMN sale_date TO start_date;

-- Add end_date column
ALTER TABLE garage_sales ADD COLUMN end_date DATE;

-- Populate end_date with start_date for existing rows
UPDATE garage_sales SET end_date = start_date;

-- Make end_date NOT NULL
ALTER TABLE garage_sales ALTER COLUMN end_date SET NOT NULL;

-- Drop old index and add new ones
DROP INDEX IF EXISTS idx_garage_sales_sale_date;
CREATE INDEX idx_garage_sales_dates ON garage_sales(start_date, end_date);
