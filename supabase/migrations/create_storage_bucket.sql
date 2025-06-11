-- Create storage bucket for bottle photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'bottles',
  'bottles',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public uploads
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'bottles');

-- Create policy to allow public downloads
CREATE POLICY "Allow public downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'bottles');

-- Create policy to allow public updates (for overwriting)
CREATE POLICY "Allow public updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'bottles');

-- Create policy to allow public deletes
CREATE POLICY "Allow public deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'bottles'); 