-- Fix RLS policies for notifications table
-- Drop the old INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Create new INSERT policy that allows authenticated users to insert
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
