-- Fix foreign key constraint on messages table to cascade on delete
-- This allows conversations to be deleted even if they have messages

-- Drop the existing foreign key constraint
ALTER TABLE messages
DROP CONSTRAINT messages_conversation_id_fkey;

-- Add the new foreign key constraint with ON DELETE CASCADE
ALTER TABLE messages
ADD CONSTRAINT messages_conversation_id_fkey
FOREIGN KEY (conversation_id)
REFERENCES conversations(id)
ON DELETE CASCADE;
