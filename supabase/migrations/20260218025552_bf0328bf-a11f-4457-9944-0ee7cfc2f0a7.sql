-- Allow public read access to property-images bucket
CREATE POLICY "Public read property images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'property-images');