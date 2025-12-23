/*
  # Add image support to questions

  1. Schema Changes
    - Add `image_url` column to questions table for storing uploaded images
    - Add `image_filename` column for original filename reference

  2. Security
    - Update existing RLS policies to include new columns
*/

-- Add image columns to questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE questions ADD COLUMN image_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'image_filename'
  ) THEN
    ALTER TABLE questions ADD COLUMN image_filename text;
  END IF;
END $$;