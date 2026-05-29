-- Add view_count column
ALTER TABLE garage_sales ADD COLUMN view_count INTEGER DEFAULT 0 NOT NULL;

-- Create RPC function to safely increment view_count
CREATE OR REPLACE FUNCTION increment_garage_sale_view(sale_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE garage_sales
  SET view_count = view_count + 1
  WHERE id = sale_id;
END;
$$;
