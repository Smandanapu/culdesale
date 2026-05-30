-- Add model_url to garage_sales
ALTER TABLE garage_sales ADD COLUMN IF NOT EXISTS model_url TEXT;

-- Insert bucket for 3D models if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('garage_sale_models', 'garage_sale_models', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for garage_sale_models bucket
CREATE POLICY "Public models are viewable by everyone." 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'garage_sale_models' );

CREATE POLICY "Authenticated users can upload models." 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'garage_sale_models' AND auth.role() = 'authenticated' );

CREATE POLICY "Users can update their own models." 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'garage_sale_models' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own models." 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'garage_sale_models' AND auth.uid() = owner );
