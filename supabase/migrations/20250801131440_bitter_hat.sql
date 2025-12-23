/*
  # Create Sessions System

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key)
      - `name` (text, session name)
      - `description` (text, optional description)
      - `teacher_id` (uuid, references teachers)
      - `class_id` (uuid, references classes)
      - `course_id` (uuid, optional, references courses)
      - `is_active` (boolean, default true)
      - `expires_at` (timestamptz, optional expiration)
      - `created_at` (timestamptz)
    - `session_tags`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `tag_id` (uuid, references tags)
    - `session_participants`
      - `id` (uuid, primary key)
      - `session_id` (uuid, references sessions)
      - `user_email` (text, participant email)
      - `joined_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Teachers can manage their own sessions
    - Students can view sessions for their enrolled classes
    - Participants can join sessions for their classes
*/

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id),
  is_active boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create session_tags junction table
CREATE TABLE IF NOT EXISTS session_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  UNIQUE(session_id, tag_id)
);

-- Create session_participants table
CREATE TABLE IF NOT EXISTS session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sessions_teacher_id_idx ON sessions(teacher_id);
CREATE INDEX IF NOT EXISTS sessions_class_id_idx ON sessions(class_id);
CREATE INDEX IF NOT EXISTS sessions_course_id_idx ON sessions(course_id);
CREATE INDEX IF NOT EXISTS sessions_is_active_idx ON sessions(is_active);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS session_tags_session_id_idx ON session_tags(session_id);
CREATE INDEX IF NOT EXISTS session_tags_tag_id_idx ON session_tags(tag_id);
CREATE INDEX IF NOT EXISTS session_participants_session_id_idx ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS session_participants_user_email_idx ON session_participants(user_email);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions table
CREATE POLICY "Teachers can manage own sessions"
  ON sessions
  FOR ALL
  TO authenticated
  USING (teacher_id IN (
    SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email')
  ))
  WITH CHECK (teacher_id IN (
    SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email')
  ));

CREATE POLICY "Students can view sessions for enrolled classes"
  ON sessions
  FOR SELECT
  TO authenticated
  USING (class_id IN (
    SELECT class_id FROM class_members WHERE user_email = (auth.jwt() ->> 'email')
  ));

-- RLS Policies for session_tags table
CREATE POLICY "Teachers can manage tags for own sessions"
  ON session_tags
  FOR ALL
  TO authenticated
  USING (session_id IN (
    SELECT s.id FROM sessions s
    JOIN teachers t ON s.teacher_id = t.id
    WHERE t.email = (auth.jwt() ->> 'email')
  ))
  WITH CHECK (session_id IN (
    SELECT s.id FROM sessions s
    JOIN teachers t ON s.teacher_id = t.id
    WHERE t.email = (auth.jwt() ->> 'email')
  ));

CREATE POLICY "Students can view tags for accessible sessions"
  ON session_tags
  FOR SELECT
  TO authenticated
  USING (session_id IN (
    SELECT s.id FROM sessions s
    WHERE s.class_id IN (
      SELECT class_id FROM class_members WHERE user_email = (auth.jwt() ->> 'email')
    )
  ));

-- RLS Policies for session_participants table
CREATE POLICY "Teachers can view participants for own sessions"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (session_id IN (
    SELECT s.id FROM sessions s
    JOIN teachers t ON s.teacher_id = t.id
    WHERE t.email = (auth.jwt() ->> 'email')
  ));

CREATE POLICY "Students can join sessions for enrolled classes"
  ON session_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    session_id IN (
      SELECT s.id FROM sessions s
      WHERE s.class_id IN (
        SELECT class_id FROM class_members WHERE user_email = (auth.jwt() ->> 'email')
      )
    )
    AND user_email = (auth.jwt() ->> 'email')
  );

CREATE POLICY "Students can view own participation"
  ON session_participants
  FOR SELECT
  TO authenticated
  USING (user_email = (auth.jwt() ->> 'email'));

CREATE POLICY "Teachers can remove participants from own sessions"
  ON session_participants
  FOR DELETE
  TO authenticated
  USING (session_id IN (
    SELECT s.id FROM sessions s
    JOIN teachers t ON s.teacher_id = t.id
    WHERE t.email = (auth.jwt() ->> 'email')
  ));