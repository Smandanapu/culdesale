-- Add performance indexes for frequently queried columns in the listings table
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings (category);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_zip_code ON public.listings (zip_code);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_ends_at ON public.listings (ends_at ASC);

-- Compound index for feed filtering (e.g. active electronics ending soon)
CREATE INDEX IF NOT EXISTS idx_listings_feed_filter ON public.listings (status, category, created_at DESC);
