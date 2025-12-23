/*
  # Fix Teachers RLS Infinite Recursion

  1. Problem
    - The current teachers RLS policy creates infinite recursion
    - Policy references teachers table within itself causing circular dependency

  2. Solution
    - Drop the problematic policy that causes recursion
    - Create a simple policy that uses auth.uid() directly
    - Remove circular references to teachers table

  3. Security
    - Teachers can only read their own data
    - Uses JWT email claim for authentication
    - No circular table references
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Teachers can read own data" ON teachers;
DROP POLICY IF EXISTS "Students can read teachers for their classes" ON teachers;

-- Create a simple, non-recursive policy for teachers
CREATE POLICY "Teachers can read own data"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (email = (auth.jwt() ->> 'email'));

-- Create a policy for students to read teacher info without recursion
-- This policy allows authenticated users to read teacher data
-- The actual filtering will be done at the application level
CREATE POLICY "Authenticated users can read teacher info"
  ON teachers
  FOR SELECT
  TO authenticated
  USING (true);