/*
  # Add Question Selection to Sessions

  1. New Tables
    - `session_questions`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to sessions)
      - `question_id` (uuid, foreign key to questions)
      - `order_index` (integer, for question ordering)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `session_questions` table
    - Add policies for teachers to manage questions in their sessions
    - Add policies for students to read questions in sessions they can access

  3. Indexes
    - Index on session_id for efficient lookups
    - Unique constraint on session_id + question_id to prevent duplicates
    - Index on order for sorting
*/

CREATE TABLE IF NOT EXISTS session_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, question_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS session_questions_session_id_idx ON session_questions(session_id);
CREATE INDEX IF NOT EXISTS session_questions_order_idx ON session_questions(session_id, order_index);

-- Enable RLS
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;

-- Teachers can manage questions in their own sessions
CREATE POLICY "Teachers can manage questions in own sessions"
  ON session_questions
  FOR ALL
  TO authenticated
  USING (
    session_id IN (
      SELECT s.id 
      FROM sessions s 
      JOIN teachers t ON s.teacher_id = t.id 
      WHERE t.email = (auth.jwt() ->> 'email'::text)
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT s.id 
      FROM sessions s 
      JOIN teachers t ON s.teacher_id = t.id 
      WHERE t.email = (auth.jwt() ->> 'email'::text)
    )
  );

-- Students can read questions in sessions they can access
CREATE POLICY "Students can read questions in accessible sessions"
  ON session_questions
  FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT s.id
      FROM sessions s
      JOIN classes c ON s.class_id = c.id
      JOIN class_members cm ON c.id = cm.class_id
      WHERE cm.user_email = (auth.jwt() ->> 'email'::text)
        AND s.is_active = true
        AND (s.expires_at IS NULL OR s.expires_at > now())
    )
  );