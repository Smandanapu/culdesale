-- Allow any authenticated user to reserve an active listing
CREATE POLICY "Buyers can reserve active listings"
ON listings FOR UPDATE
USING (
  status = 'active'
)
WITH CHECK (
  status = 'reserved' AND
  reserved_by = auth.uid() AND
  reserved_at IS NOT NULL
);
