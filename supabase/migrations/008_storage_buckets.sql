-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('food-images', 'food-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('food-thumbnails', 'food-thumbnails', true, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- Storage RLS policies
CREATE POLICY "Anyone can view food images"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('food-images', 'food-thumbnails', 'avatars'));

CREATE POLICY "Authenticated users can upload food images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'food-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own images"
  ON storage.objects FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
