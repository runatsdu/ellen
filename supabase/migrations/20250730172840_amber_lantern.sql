/*
  # Create courses table and update questions

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, nullable)
      - `created_at` (timestamp)

  2. Changes
    - Add `course_id` column to `questions` table
    - Add foreign key constraint from questions to courses
    - Insert default course types
    - Update existing questions with random course assignments

  3. Security
    - Enable RLS on `courses` table
    - Add policy for authenticated users to read courses
*/

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Create policy for reading courses (all authenticated users can read courses)
CREATE POLICY "Authenticated users can read courses"
  ON courses
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert default courses
INSERT INTO courses (name, description) VALUES
  ('Mathematics', 'Mathematical concepts, calculations, and problem-solving'),
  ('Geography', 'Physical and human geography, maps, and spatial relationships'),
  ('History', 'Historical events, periods, and civilizations'),
  ('Science', 'General science concepts and scientific method'),
  ('Biology', 'Living organisms, life processes, and ecosystems'),
  ('Chemistry', 'Chemical elements, compounds, and reactions'),
  ('Physics', 'Physical laws, forces, energy, and matter'),
  ('Literature', 'Reading comprehension, literary analysis, and writing'),
  ('Art', 'Visual arts, creativity, and artistic expression'),
  ('Music', 'Musical theory, instruments, and composition'),
  ('Physical Education', 'Sports, fitness, and physical health'),
  ('Computer Science', 'Programming, algorithms, and digital technology')
ON CONFLICT (name) DO NOTHING;

-- Add course_id column to questions table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'course_id'
  ) THEN
    ALTER TABLE questions ADD COLUMN course_id uuid REFERENCES courses(id);
  END IF;
END $$;

-- Update existing questions to have random course assignments
DO $$
DECLARE
  course_ids uuid[];
  question_record RECORD;
  random_course_id uuid;
BEGIN
  -- Get all course IDs
  SELECT ARRAY(SELECT id FROM courses) INTO course_ids;
  
  -- Update each question without a course_id
  FOR question_record IN 
    SELECT id FROM questions WHERE course_id IS NULL
  LOOP
    -- Pick a random course
    random_course_id := course_ids[1 + floor(random() * array_length(course_ids, 1))];
    
    -- Update the question
    UPDATE questions 
    SET course_id = random_course_id 
    WHERE id = question_record.id;
  END LOOP;
END $$;