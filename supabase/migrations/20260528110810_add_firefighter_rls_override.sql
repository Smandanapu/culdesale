-- Allow Firefighter to update any listing
CREATE POLICY "Firefighter can update any listing"
ON listings FOR UPDATE
USING (auth.jwt() ->> 'email' = 'satish.dfw@gmail.com');

-- Allow Firefighter to delete any listing
CREATE POLICY "Firefighter can delete any listing"
ON listings FOR DELETE
USING (auth.jwt() ->> 'email' = 'satish.dfw@gmail.com');
