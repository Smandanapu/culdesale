-- Create garage_sales table (isolated feature — safe to drop entirely)
CREATE TABLE IF NOT EXISTS garage_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT '',
  zip_code TEXT NOT NULL DEFAULT '',
  latitude FLOAT8,
  longitude FLOAT8,
  sale_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '14:00',
  categories TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE garage_sales ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required)
DROP POLICY IF EXISTS "Anyone can view garage sales" ON garage_sales;
CREATE POLICY "Anyone can view garage sales"
  ON garage_sales FOR SELECT
  USING (true);

-- Only authenticated users can create
DROP POLICY IF EXISTS "Authenticated users can create garage sales" ON garage_sales;
CREATE POLICY "Authenticated users can create garage sales"
  ON garage_sales FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Only the seller can update their own sale
DROP POLICY IF EXISTS "Sellers can update their own garage sales" ON garage_sales;
CREATE POLICY "Sellers can update their own garage sales"
  ON garage_sales FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Only the seller can delete their own sale
DROP POLICY IF EXISTS "Sellers can delete their own garage sales" ON garage_sales;
CREATE POLICY "Sellers can delete their own garage sales"
  ON garage_sales FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_garage_sales_seller_id ON garage_sales(seller_id);
-- sale_date index skipped to avoid errors on already migrated remote databases
CREATE INDEX IF NOT EXISTS idx_garage_sales_status ON garage_sales(status);
CREATE INDEX IF NOT EXISTS idx_garage_sales_zip_code ON garage_sales(zip_code);
CREATE INDEX IF NOT EXISTS idx_garage_sales_coords ON garage_sales(latitude, longitude);
