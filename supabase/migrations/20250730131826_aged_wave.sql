/*
  # Create answers table

  1. New Tables
    - `answers`
      - `id` (uuid, primary key)
      - `question_id` (uuid, foreign key to questions)
      - `content` (text, the answer content)
      - `is_correct` (boolean, marks correct answers)
      - `order_index` (integer, for ordering answers)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `answers` table
    - Add policies for teachers to manage answers for their own questions

  3. Performance
    - Add indexes for efficient querying by question_id and ordering
*/

-- Create the answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS answers_question_id_idx ON answers(question_id);
CREATE INDEX IF NOT EXISTS answers_question_order_idx ON answers(question_id, order_index);

-- RLS Policies for answers table
-- Teachers can read answers for their own questions
CREATE POLICY "Teachers can read answers for own questions"
  ON answers
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

-- Teachers can create answers for their own questions
CREATE POLICY "Teachers can create answers for own questions"
  ON answers
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

-- Teachers can update answers for their own questions
CREATE POLICY "Teachers can update answers for own questions"
  ON answers
  FOR UPDATE
  TO authenticated
  USING (
    question_id IN (
      SELECT q.id 
      FROM questions q 
      JOIN teachers t ON q.teacher_id = t.id 
      WHERE t.email = (auth.jwt() ->> 'email'::text)
    )
  )
  WITH CHECK (
    question_id IN (
      SELECT q.id 
      FROM questions q 
      JOIN teachers t ON q.teacher_id = t.id 
      WHERE t.email = (auth.jwt() ->> 'email'::text)
    )
  );

-- Teachers can delete answers for their own questions
CREATE POLICY "Teachers can delete answers for own questions"
  ON answers
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