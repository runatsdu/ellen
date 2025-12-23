/*
  # Create Tags System for Questions

  1. New Tables
    - `tags`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text, optional)
      - `color` (text, default blue)
      - `created_at` (timestamp)
    - `question_tags`
      - `id` (uuid, primary key)
      - `question_id` (uuid, foreign key to questions)
      - `tag_id` (uuid, foreign key to tags)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Tags are readable by authenticated users
    - Question_tags follow question ownership rules

  3. Sample Data
    - Pre-populate with common educational tags including "slope coefficient"
*/

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  created_at timestamptz DEFAULT now()
);

-- Create question_tags junction table
CREATE TABLE IF NOT EXISTS question_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(question_id, tag_id)
);

-- Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Authenticated users can read tags"
  ON tags
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for question_tags
CREATE POLICY "Teachers can read question tags for own questions"
  ON question_tags
  FOR SELECT
  TO authenticated
  USING (
    question_id IN (
      SELECT q.id
      FROM questions q
      JOIN teachers t ON q.teacher_id = t.id
      WHERE t.email = (auth.jwt() ->> 'email'::text)
    )
  );

CREATE POLICY "Teachers can create question tags for own questions"
  ON question_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    question_id IN (
      SELECT q.id
      FROM questions q
      JOIN teachers t ON q.teacher_id = t.id
      WHERE t.email = (auth.jwt() ->> 'email'::text)
    )
  );

CREATE POLICY "Teachers can delete question tags for own questions"
  ON question_tags
  FOR DELETE
  TO authenticated
  USING (
    question_id IN (
      SELECT q.id
      FROM questions q
      JOIN teachers t ON q.teacher_id = t.id
      WHERE t.email = (auth.jwt() ->> 'email'::text)
    )
  );

-- Insert sample tags
INSERT INTO tags (name, description, color) VALUES
  ('slope coefficient', 'Mathematical concept related to linear equations', '#EF4444'),
  ('algebra', 'Branch of mathematics dealing with symbols and equations', '#3B82F6'),
  ('geometry', 'Branch of mathematics dealing with shapes and space', '#10B981'),
  ('calculus', 'Mathematical study of continuous change', '#8B5CF6'),
  ('statistics', 'Collection, analysis, and interpretation of data', '#F59E0B'),
  ('probability', 'Mathematical study of randomness and uncertainty', '#EC4899'),
  ('trigonometry', 'Study of triangles and periodic functions', '#06B6D4'),
  ('linear equations', 'Equations that form straight lines when graphed', '#84CC16'),
  ('quadratic equations', 'Second-degree polynomial equations', '#F97316'),
  ('functions', 'Mathematical relationships between inputs and outputs', '#6366F1'),
  ('derivatives', 'Rate of change in calculus', '#14B8A6'),
  ('integrals', 'Area under curves in calculus', '#A855F7'),
  ('matrices', 'Rectangular arrays of numbers', '#EAB308'),
  ('vectors', 'Quantities with both magnitude and direction', '#F43F5E'),
  ('complex numbers', 'Numbers with real and imaginary parts', '#0EA5E9')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS question_tags_question_id_idx ON question_tags(question_id);
CREATE INDEX IF NOT EXISTS question_tags_tag_id_idx ON question_tags(tag_id);
CREATE INDEX IF NOT EXISTS tags_name_idx ON tags(name);