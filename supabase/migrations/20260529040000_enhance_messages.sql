-- Enhance messages table with new columns for rich chat
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS offer_amount NUMERIC,
ADD COLUMN IF NOT EXISTS offer_status TEXT;

-- Create chat-images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true) 
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects on chat-images bucket
-- Note: We use IF NOT EXISTS pattern by dropping policies first to allow safe re-runs

DROP POLICY IF EXISTS "Public chat images are viewable by everyone." ON storage.objects;
CREATE POLICY "Public chat images are viewable by everyone." 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'chat-images' );

DROP POLICY IF EXISTS "Authenticated users can upload chat images." ON storage.objects;
CREATE POLICY "Authenticated users can upload chat images." 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'chat-images' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update their own chat images." ON storage.objects;
CREATE POLICY "Users can update their own chat images." 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'chat-images' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own chat images." ON storage.objects;
CREATE POLICY "Users can delete their own chat images." 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'chat-images' AND auth.uid() = owner );
