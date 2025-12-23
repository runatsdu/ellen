/*
  # Create teachers table and questions system

  1. New Tables
    - `teachers`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `created_at` (timestamp)
    - `questions`
      - `id` (uuid, primary key) 
      - `title` (text, not null)
      - `content` (text, not null)
      - `teacher_id` (uuid, foreign key to teachers)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Teachers can only see their own questions
    - Only authenticated users who are teachers can access teacher data
*/

-- Create teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Teachers can read their own data
CREATE POLICY "Teachers can read own data"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Teachers can read their own questions
CREATE POLICY "Teachers can read own questions"
  ON questions
  FOR SELECT
  TO authenticated
  USING (teacher_id IN (
    SELECT id FROM teachers WHERE email = auth.jwt() ->> 'email'
  ));

-- Teachers can insert their own questions
CREATE POLICY "Teachers can create questions"
  ON questions
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id IN (
    SELECT id FROM teachers WHERE email = auth.jwt() ->> 'email'
  ));

-- Teachers can update their own questions
CREATE POLICY "Teachers can update own questions"
  ON questions
  FOR UPDATE
  TO authenticated
  USING (teacher_id IN (
    SELECT id FROM teachers WHERE email = auth.jwt() ->> 'email'
  ));

-- Teachers can delete their own questions
CREATE POLICY "Teachers can delete own questions"
  ON questions
  FOR DELETE
  TO authenticated
  USING (teacher_id IN (
    SELECT id FROM teachers WHERE email = auth.jwt() ->> 'email'
  ));

-- Insert some sample teacher emails
INSERT INTO teachers (email) VALUES 
  ('teacher1@school.edu'),
  ('teacher2@school.edu'),
  ('admin@school.edu')
ON CONFLICT (email) DO NOTHING;