-- Add dimension columns to listings table (stored in inches)
ALTER TABLE public.listings
  ADD COLUMN dim_length numeric,
  ADD COLUMN dim_width numeric,
  ADD COLUMN dim_height numeric;
