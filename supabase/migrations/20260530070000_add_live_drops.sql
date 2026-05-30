-- Add live drop columns to listings table
ALTER TABLE public.listings
  ADD COLUMN is_live_drop boolean DEFAULT false,
  ADD COLUMN drop_time timestamptz;
