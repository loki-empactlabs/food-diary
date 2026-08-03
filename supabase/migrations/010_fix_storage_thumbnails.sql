CREATE POLICY "Authenticated users can upload food thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'food-thumbnails'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
