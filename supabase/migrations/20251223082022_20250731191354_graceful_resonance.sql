/*
  # Create Classes System

  1. New Tables
    - `classes`
      - `id` (uuid, primary key)
      - `name` (text, class name like "Math 5. Grade")
      - `description` (text, optional description)
      - `teacher_id` (uuid, foreign key to teachers)
      - `created_at` (timestamp)
    - `class_members`
      - `id` (uuid, primary key)
      - `class_id` (uuid, foreign key to classes)
      - `user_email` (text, student email)
      - `joined_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Teachers can only manage their own classes
    - Teachers can only see members of their own classes
*/

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create class_members table
CREATE TABLE IF NOT EXISTS class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(class_id, user_email)
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_members ENABLE ROW LEVEL SECURITY;

-- Classes policies
CREATE POLICY "Teachers can read own classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (teacher_id IN (
    SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'::text)
  ));

CREATE POLICY "Teachers can create classes"
  ON classes
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id IN (
    SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'::text)
  ));

CREATE POLICY "Teachers can update own classes"
  ON classes
  FOR UPDATE
  TO authenticated
  USING (teacher_id IN (
    SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'::text)
  ))
  WITH CHECK (teacher_id IN (
    SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'::text)
  ));

CREATE POLICY "Teachers can delete own classes"
  ON classes
  FOR DELETE
  TO authenticated
  USING (teacher_id IN (
    SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'::text)
  ));

-- Class members policies
CREATE POLICY "Teachers can read members of own classes"
  ON class_members
  FOR SELECT
  TO authenticated
  USING (class_id IN (
    SELECT c.id FROM classes c
    JOIN teachers t ON c.teacher_id = t.id
    WHERE t.email = (auth.jwt() ->> 'email'::text)
  ));

CREATE POLICY "Teachers can add members to own classes"
  ON class_members
  FOR INSERT
  TO authenticated
  WITH CHECK (class_id IN (
    SELECT c.id FROM classes c
    JOIN teachers t ON c.teacher_id = t.id
    WHERE t.email = (auth.jwt() ->> 'email'::text)
  ));

CREATE POLICY "Teachers can remove members from own classes"
  ON class_members
  FOR DELETE
  TO authenticated
  USING (class_id IN (
    SELECT c.id FROM classes c
    JOIN teachers t ON c.teacher_id = t.id
    WHERE t.email = (auth.jwt() ->> 'email'::text)
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS classes_teacher_id_idx ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS class_members_class_id_idx ON class_members(class_id);
CREATE INDEX IF NOT EXISTS class_members_email_idx ON class_members(user_email);