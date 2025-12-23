/*
  # Add Student Access to Classes

  1. Security Changes
    - Add RLS policy for students to read classes they're enrolled in
    - Add RLS policy for students to read their class memberships
    - Add RLS policy for students to read teacher info for their classes

  2. New Policies
    - Students can read classes where they are members
    - Students can read their own class memberships
    - Students can read teacher emails for classes they're in
*/

-- Allow students to read classes they're enrolled in
CREATE POLICY "Students can read classes they're enrolled in"
  ON classes
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT class_id 
      FROM class_members 
      WHERE user_email = (auth.jwt() ->> 'email'::text)
    )
  );

-- Allow students to read their own class memberships
CREATE POLICY "Students can read own class memberships"
  ON class_members
  FOR SELECT
  TO authenticated
  USING (user_email = (auth.jwt() ->> 'email'::text));

-- Allow students to read teacher info for classes they're in
CREATE POLICY "Students can read teachers for their classes"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT teacher_id 
      FROM classes 
      WHERE id IN (
        SELECT class_id 
        FROM class_members 
        WHERE user_email = (auth.jwt() ->> 'email'::text)
      )
    )
  );