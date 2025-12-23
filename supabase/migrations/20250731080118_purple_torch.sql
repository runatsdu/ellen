 CREATE POLICY "Teachers can create question tags for own questions"
   ON question_tags
   FOR INSERT
   TO authenticated
-  WITH CHECK (question_id IN (
-    SELECT q.id 
-    FROM questions q 
-    JOIN teachers t ON q.teacher_id = t.id 
-    WHERE t.email = (jwt() ->> 'email'::text)
-  ));
+  WITH CHECK (question_id IN (
+    SELECT q.id 
+    FROM questions q 
+    JOIN teachers t ON q.teacher_id = t.id 
+    WHERE t.email = (auth.jwt() ->> 'email'::text)
+  ));

 CREATE POLICY "Teachers can read question tags for own questions"
   ON question_tags
   FOR SELECT
   TO authenticated
-  USING (question_id IN (
-    SELECT q.id 
-    FROM questions q 
-    JOIN teachers t ON q.teacher_id = t.id 
-    WHERE t.email = (jwt() ->> 'email'::text)
-  ));
+  USING (question_id IN (
+    SELECT q.id 
+    FROM questions q 
+    JOIN teachers t ON q.teacher_id = t.id 
+    WHERE t.email = (auth.jwt() ->> 'email'::text)
+  ));

 CREATE POLICY "Teachers can delete question tags for own questions"
   ON question_tags
   FOR DELETE
   TO authenticated
-  USING (question_id IN (
-    SELECT q.id 
-    FROM questions q 
-    JOIN teachers t ON q.teacher_id = t.id 
-    WHERE t.email = (jwt() ->> 'email'::text)
-  ));
+  USING (question_id IN (
+    SELECT q.id 
+    FROM questions q 
+    JOIN teachers t ON q.teacher_id = t.id 
+    WHERE t.email = (auth.jwt() ->> 'email'::text)
+  ));