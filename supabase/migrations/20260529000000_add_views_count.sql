-- Add views_count column to listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0 NOT NULL;

-- Index for faster analytics query by seller
CREATE INDEX IF NOT EXISTS idx_listings_seller_views ON listings(seller_id, views_count);
