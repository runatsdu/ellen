/*
  # Setup storage policies for question images

  1. Storage Configuration
    - Enable RLS on storage.objects
    - Create policies for question-images bucket
  
  2. Security Policies
    - Allow authenticated users to upload images
    - Allow public read access to images
    - Allow authenticated users to delete their uploads
*/

-- Enable RLS on storage.objects if not already enabled

-- Policy for uploading images (INSERT)
CREATE POLICY "Authenticated users can upload question images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'question-images' AND
  auth.uid() IS NOT NULL
);

-- Policy for viewing images (SELECT)
CREATE POLICY "Anyone can view question images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'question-images');

-- Policy for deleting images (DELETE)
CREATE POLICY "Authenticated users can delete question images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'question-images' AND
  auth.uid() IS NOT NULL
);