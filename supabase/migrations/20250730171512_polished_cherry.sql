/*
  # Add Courses Table and Update Questions

  1. New Tables
    - `courses`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `created_at` (timestamp)

  2. Changes
    - Add `course_id` column to `questions` table
    - Add foreign key constraint from questions to courses
    - Insert default course types (Mathematics, Geography, etc.)
    - Update existing questions to random courses

  3. Security
    - Enable RLS on `courses` table
    - Add policy for authenticated users to read courses
    - Update questions policies to work with course relationship
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

-- Insert default course types
INSERT INTO courses (name, description) VALUES
  ('Mathematics', 'Mathematical concepts, calculations, and problem-solving'),
  ('Geography', 'Physical and human geography, maps, and spatial relationships'),
  ('History', 'Historical events, periods, and civilizations'),
  ('Science', 'General science concepts, experiments, and discoveries'),
  ('Biology', 'Living organisms, ecosystems, and life processes'),
  ('Chemistry', 'Chemical elements, reactions, and molecular structures'),
  ('Physics', 'Physical laws, forces, and natural phenomena'),
  ('Literature', 'Literary works, authors, and language arts'),
  ('Art', 'Visual arts, art history, and creative expression'),
  ('Music', 'Musical theory, instruments, and composition'),
  ('Physical Education', 'Sports, fitness, and physical activities'),
  ('Computer Science', 'Programming, algorithms, and technology concepts')
ON CONFLICT (name) DO NOTHING;

-- Add course_id column to questions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questions' AND column_name = 'course_id'
  ) THEN
    ALTER TABLE questions ADD COLUMN course_id uuid;
  END IF;
END $$;

-- Add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'questions_course_id_fkey'
  ) THEN
    ALTER TABLE questions 
    ADD CONSTRAINT questions_course_id_fkey 
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update existing questions to random courses
DO $$
DECLARE
  course_ids uuid[];
  question_record RECORD;
  random_course_id uuid;
BEGIN
  -- Get all course IDs
  SELECT ARRAY(SELECT id FROM courses) INTO course_ids;
  
  -- Update each question with a random course
  FOR question_record IN SELECT id FROM questions WHERE course_id IS NULL LOOP
    -- Pick a random course ID
    random_course_id := course_ids[1 + floor(random() * array_length(course_ids, 1))];
    
    -- Update the question
    UPDATE questions 
    SET course_id = random_course_id 
    WHERE id = question_record.id;
  END LOOP;
END $$;