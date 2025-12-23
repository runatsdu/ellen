@@ .. @@
 CREATE POLICY "Teachers can manage own sessions"
   ON sessions
   FOR ALL
   TO authenticated
-  USING (teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email')))
-  WITH CHECK (teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email')));
+  USING (teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email')))
+  WITH CHECK (teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email')));
 
 -- Students can read sessions for classes they're in
 CREATE POLICY "Students can read class sessions"
   ON sessions
   FOR SELECT
   TO authenticated
-  USING (class_id IN (SELECT class_id FROM class_members WHERE user_email = (jwt() ->> 'email')));
+  USING (class_id IN (SELECT class_id FROM class_members WHERE user_email = (auth.jwt() ->> 'email')));
 
 -- Session tags policies
 CREATE POLICY "Teachers can manage session tags for own sessions"
@@ .. @@
   FOR ALL
   TO authenticated
   USING (session_id IN (
-    SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email'))
+    SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'))
   ))
   WITH CHECK (session_id IN (
-    SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email'))
+    SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'))
   ));
 
 -- Students can read session tags for sessions they can access
@@ .. @@
   FOR SELECT
   TO authenticated
   USING (session_id IN (
-    SELECT id FROM sessions WHERE class_id IN (SELECT class_id FROM class_members WHERE user_email = (jwt() ->> 'email'))
+    SELECT id FROM sessions WHERE class_id IN (SELECT class_id FROM class_members WHERE user_email = (auth.jwt() ->> 'email'))
   ));
 
 -- Session participants policies
@@ .. @@
   ON session_participants
   FOR INSERT
   TO authenticated
-  WITH CHECK (user_email = (jwt() ->> 'email') AND session_id IN (
-    SELECT id FROM sessions WHERE class_id IN (SELECT class_id FROM class_members WHERE user_email = (jwt() ->> 'email'))
+  WITH CHECK (user_email = (auth.jwt() ->> 'email') AND session_id IN (
+    SELECT id FROM sessions WHERE class_id IN (SELECT class_id FROM class_members WHERE user_email = (auth.jwt() ->> 'email'))
   ));
 
 -- Students can read own participation
@@ .. @@
   ON session_participants
   FOR SELECT
   TO authenticated
-  USING (user_email = (jwt() ->> 'email'));
+  USING (user_email = (auth.jwt() ->> 'email'));
 
 -- Teachers can read participants for their sessions
 CREATE POLICY "Teachers can read session participants"
@@ .. @@
   FOR SELECT
   TO authenticated
   USING (session_id IN (
-    SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email'))
+    SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'))
   ));