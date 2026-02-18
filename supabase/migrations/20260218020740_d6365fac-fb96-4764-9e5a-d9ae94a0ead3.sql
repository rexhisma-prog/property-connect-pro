
-- Ensure storage buckets exist for ads and properties
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('ad-media', 'ad-media', true, 52428800, ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg','image/png','image/webp','image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif'];

-- RLS for ad-media bucket
CREATE POLICY "Public read ad-media" ON storage.objects
  FOR SELECT USING (bucket_id = 'ad-media');

CREATE POLICY "Anyone can upload ad-media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ad-media');

-- RLS for property-images bucket  
CREATE POLICY "Public read property-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated upload property-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);
