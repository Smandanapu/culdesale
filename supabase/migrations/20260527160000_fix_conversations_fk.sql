-- Fix foreign key constraint on conversations table to cascade on delete
-- This allows listings to be deleted even if they have conversations

-- Drop the existing foreign key constraint
ALTER TABLE conversations
DROP CONSTRAINT conversations_listing_id_fkey;

-- Add the new foreign key constraint with ON DELETE CASCADE
ALTER TABLE conversations
ADD CONSTRAINT conversations_listing_id_fkey
FOREIGN KEY (listing_id)
REFERENCES listings(id)
ON DELETE CASCADE;
