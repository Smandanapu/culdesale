-- Add reserved status support to listings
-- Adds reserved_by (who clicked Buy It Now) and reserved_at (when) columns

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS reserved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reserved_at TIMESTAMPTZ;

-- Create an index for efficient lookup of active reservations per user
CREATE INDEX IF NOT EXISTS idx_listings_reserved_by ON listings(reserved_by) WHERE reserved_by IS NOT NULL;

-- Create a function to auto-expire reservations older than 24 hours
-- This can be called by pg_cron or manually
CREATE OR REPLACE FUNCTION expire_stale_reservations()
RETURNS void AS $$
BEGIN
  UPDATE listings
  SET status = 'active',
      reserved_by = NULL,
      reserved_at = NULL
  WHERE status = 'reserved'
    AND reserved_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule auto-expiry every hour (requires pg_cron extension)
-- If pg_cron is not available, this will silently fail
DO $$
BEGIN
  PERFORM cron.schedule(
    'expire-stale-reservations',
    '0 * * * *',
    'SELECT expire_stale_reservations()'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron not available - reservations will need manual expiry or Edge Function cron';
END;
$$;
