@@ .. @@
 CREATE POLICY "Teachers can create sessions"
   ON sessions
   FOR INSERT
   TO authenticated
-  WITH CHECK (teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email')));
+  WITH CHECK (teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email')));

 CREATE POLICY "Teachers can read own sessions"
   ON sessions
   FOR SELECT
   TO authenticated
-  USING (teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email')));
+  USING (teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email')));

 CREATE POLICY "Teachers can update own sessions"
   ON sessions
   FOR UPDATE
   TO authenticated
-  USING (teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email')))
-  WITH CHECK (teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email')));
+  USING (teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email')))
+  WITH CHECK (teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email')));

 CREATE POLICY "Teachers can delete own sessions"
   ON sessions
   FOR DELETE
   TO authenticated
-  USING (teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email')));
+  USING (teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email')));

 -- Students can read sessions for classes they're in
 CREATE POLICY "Students can read sessions for their classes"
@@ .. @@
 CREATE POLICY "Teachers can manage session tags for own sessions"
   ON session_tags
   FOR ALL
   TO authenticated
-  USING (session_id IN (SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email'))))
-  WITH CHECK (session_id IN (SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email'))));
+  USING (session_id IN (SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'))))
+  WITH CHECK (session_id IN (SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'))));

 -- Session participants policies
 CREATE POLICY "Students can join sessions for their classes"
@@ .. @@
   FOR INSERT
   TO authenticated
   WITH CHECK (
-    user_email = (jwt() ->> 'email') AND
+    user_email = (auth.jwt() ->> 'email') AND
     session_id IN (
       SELECT s.id 
       FROM sessions s
       JOIN classes c ON s.class_id = c.id
       JOIN class_members cm ON c.id = cm.class_id
-      WHERE cm.user_email = (jwt() ->> 'email')
+      WHERE cm.user_email = (auth.jwt() ->> 'email')
     )
   );

 CREATE POLICY "Users can read own participation"
   ON session_participants
   FOR SELECT
   TO authenticated
-  USING (user_email = (jwt() ->> 'email'));
+  USING (user_email = (auth.jwt() ->> 'email'));

 CREATE POLICY "Teachers can read participants for own sessions"
   ON session_participants
   FOR SELECT
   TO authenticated
-  USING (session_id IN (SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (jwt() ->> 'email'))));
+  USING (session_id IN (SELECT id FROM sessions WHERE teacher_id IN (SELECT id FROM teachers WHERE email = (auth.jwt() ->> 'email'))));