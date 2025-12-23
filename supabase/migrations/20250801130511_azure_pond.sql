/*
  # Create Sessions System

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `teacher_id` (uuid, references teachers)
      - `class_id` (uuid, references classes)
      - `course_id` (uuid, optional, references courses)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
      - `expires_at` (timestamp, optional)
    
    - `session_tags` (junction table)
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `tag_id` (uuid, references tags)
    
    - `session_participants` (track who joined)
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `user_email` (text)
      - `joined_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Teachers can manage their own sessions
    - Students can view sessions for classes they're in
    - Students can join sessions
*/

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  teacher_id uuid REFERENCES teachers(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES courses(id),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Session tags junction table
CREATE TABLE IF NOT EXISTS session_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(session_id, tag_id)
);

-- Session participants table
CREATE TABLE IF NOT EXISTS session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_email text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS sessions_teacher_id_idx ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS sessions_class_id_idx ON sessions(class_id);
CREATE INDEX IF NOT EXISTS sessions_active_idx ON sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS session_tags_session_id_idx ON session_tags(session_id);
CREATE INDEX IF NOT EXISTS session_participants_session_id_idx ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS session_participants_email_idx ON session_participants(user_email);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Teachers can manage own sessions"
  ON sessions
  FOR ALL
  TO authenticated
  USING (teacher_id IN (
    SELECT id FROM teachers WHERE email = (jwt() ->> 'email')
  ))
  WITH CHECK (teacher_id IN (
    SELECT id FROM teachers WHERE email = (jwt() ->> 'email')
  ));

CREATE POLICY "Students can view sessions for their classes"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (
    is_active = true AND
    class_id IN (
      SELECT class_id FROM class_members 
      WHERE user_email = (jwt() ->> 'email')
    )
  );

-- RLS Policies for session_tags
CREATE POLICY "Teachers can manage session tags for own sessions"
  ON session_tags
  FOR ALL
  TO authenticated
  USING (session_id IN (
    SELECT id FROM sessions WHERE teacher_id IN (
      SELECT id FROM teachers WHERE email = (jwt() ->> 'email')
    )
  ))
  WITH CHECK (session_id IN (
    SELECT id FROM sessions WHERE teacher_id IN (
      SELECT id FROM teachers WHERE email = (jwt() ->> 'email')
    )
  ));

CREATE POLICY "Students can view session tags for accessible sessions"
  ON session_tags
  FOR SELECT
  TO authenticated
  USING (session_id IN (
    SELECT s.id FROM sessions s
    JOIN class_members cm ON s.class_id = cm.class_id
    WHERE s.is_active = true AND cm.user_email = (jwt() ->> 'email')
  ));

-- RLS Policies for session_participants
CREATE POLICY "Teachers can view participants for own sessions"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (session_id IN (
    SELECT id FROM sessions WHERE teacher_id IN (
      SELECT id FROM teachers WHERE email = (jwt() ->> 'email')
    )
  ));

CREATE POLICY "Students can join sessions and view own participation"
  ON session_participants
  FOR ALL
  TO authenticated
  USING (
    user_email = (jwt() ->> 'email') AND
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN class_members cm ON s.class_id = cm.class_id
      WHERE s.is_active = true AND cm.user_email = (jwt() ->> 'email')
    )
  )
  WITH CHECK (
    user_email = (jwt() ->> 'email') AND
    session_id IN (
      SELECT s.id FROM sessions s
      JOIN class_members cm ON s.class_id = cm.class_id
      WHERE s.is_active = true AND cm.user_email = (jwt() ->> 'email')
    )
  );