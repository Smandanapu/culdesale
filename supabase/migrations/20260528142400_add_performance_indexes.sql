-- Phase 4: Database Performance Indexes
-- These indexes will vastly speed up filtering and sorting on the Feed page as the database grows.

-- Index for ordering by newest first (used as default feed sort)
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- Index for filtering by category (used in Feed category tabs)
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);

-- Index for checking listing status (active vs sold vs reserved)
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);

-- Index for sorting by ending soonest (used in Feed sorting dropdown)
CREATE INDEX IF NOT EXISTS idx_listings_ends_at ON listings(ends_at ASC) WHERE ends_at IS NOT NULL;

-- Index for sorting by price (used in Feed sorting dropdown)
CREATE INDEX IF NOT EXISTS idx_listings_current_price ON listings(current_price);
