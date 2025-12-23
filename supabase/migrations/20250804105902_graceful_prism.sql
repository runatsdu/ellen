/*
  # Tilføj danske brøk til decimal spørgsmål

  1. Nye spørgsmål
    - 8 spørgsmål om konvertering af brøker til decimaltal på dansk
    - Hver spørgsmål har 4 svarmuligheder med 1 korrekt svar
    - Spørgsmålene dækker grundlæggende brøker: 1/2, 1/3, 1/4, 1/5, 1/10, 1/100, 2/100, 3/10

  2. Struktur
    - Alle spørgsmål tildeles matematik kurset
    - Klare instruktioner på dansk
    - Uddannelsesmæssigt indhold med hints om division
*/

-- Indsæt danske brøk til decimal spørgsmål
INSERT INTO questions (title, content, course_id, teacher_id) VALUES
(
  'Konverter brøken 1/2 til decimaltal',
  'Konverter brøken 1/2 til et decimaltal. Husk at du kan dividere tælleren med nævneren for at finde decimaltallet.',
  (SELECT id FROM courses WHERE name = 'Mathematics' LIMIT 1),
  (SELECT id FROM teachers LIMIT 1)
),
(
  'Konverter brøken 1/3 til decimaltal',
  'Konverter brøken 1/3 til et decimaltal. Dette er et eksempel på et decimaltal med gentagende cifre.',
  (SELECT id FROM courses WHERE name = 'Mathematics' LIMIT 1),
  (SELECT id FROM teachers LIMIT 1)
),
(
  'Konverter brøken 1/4 til decimaltal',
  'Konverter brøken 1/4 til et decimaltal. Tænk på hvor mange fjerdedele der går på en hel.',
  (SELECT id FROM courses WHERE name = 'Mathematics' LIMIT 1),
  (SELECT id FROM teachers LIMIT 1)
),
(
  'Konverter brøken 1/5 til decimaltal',
  'Konverter brøken 1/5 til et decimaltal. Divider 1 med 5 for at finde svaret.',
  (SELECT id FROM courses WHERE name = 'Mathematics' LIMIT 1),
  (SELECT id FROM teachers LIMIT 1)
),
(
  'Konverter brøken 1/10 til decimaltal',
  'Konverter brøken 1/10 til et decimaltal. Dette er en simpel tiendedel.',
  (SELECT id FROM courses WHERE name = 'Mathematics' LIMIT 1),
  (SELECT id FROM teachers LIMIT 1)
),
(
  'Konverter brøken 1/100 til decimaltal',
  'Konverter brøken 1/100 til et decimaltal. Dette er en hundredel.',
  (SELECT id FROM courses WHERE name = 'Mathematics' LIMIT 1),
  (SELECT id FROM teachers LIMIT 1)
),
(
  'Konverter brøken 2/100 til decimaltal',
  'Konverter brøken 2/100 til et decimaltal. Dette er to hundrededele.',
  (SELECT id FROM courses WHERE name = 'Mathematics' LIMIT 1),
  (SELECT id FROM teachers LIMIT 1)
),
(
  'Konverter brøken 3/10 til decimaltal',
  'Konverter brøken 3/10 til et decimaltal. Dette er tre tiendedele.',
  (SELECT id FROM courses WHERE name = 'Mathematics' LIMIT 1),
  (SELECT id FROM teachers LIMIT 1)
);

-- Indsæt svar for 1/2 spørgsmålet
INSERT INTO answers (question_id, content, is_correct, order_index)
SELECT 
  q.id,
  unnest(ARRAY['0.5', '0.2', '0.25', '0.1']),
  unnest(ARRAY[true, false, false, false]),
  unnest(ARRAY[0, 1, 2, 3])
FROM questions q 
WHERE q.title = 'Konverter brøken 1/2 til decimaltal';

-- Indsæt svar for 1/3 spørgsmålet
INSERT INTO answers (question_id, content, is_correct, order_index)
SELECT 
  q.id,
  unnest(ARRAY['0.333... (eller 0.33)', '0.3', '0.25', '0.5']),
  unnest(ARRAY[true, false, false, false]),
  unnest(ARRAY[0, 1, 2, 3])
FROM questions q 
WHERE q.title = 'Konverter brøken 1/3 til decimaltal';

-- Indsæt svar for 1/4 spørgsmålet
INSERT INTO answers (question_id, content, is_correct, order_index)
SELECT 
  q.id,
  unnest(ARRAY['0.25', '0.4', '0.2', '0.5']),
  unnest(ARRAY[true, false, false, false]),
  unnest(ARRAY[0, 1, 2, 3])
FROM questions q 
WHERE q.title = 'Konverter brøken 1/4 til decimaltal';

-- Indsæt svar for 1/5 spørgsmålet
INSERT INTO answers (question_id, content, is_correct, order_index)
SELECT 
  q.id,
  unnest(ARRAY['0.2', '0.5', '0.25', '0.1']),
  unnest(ARRAY[true, false, false, false]),
  unnest(ARRAY[0, 1, 2, 3])
FROM questions q 
WHERE q.title = 'Konverter brøken 1/5 til decimaltal';

-- Indsæt svar for 1/10 spørgsmålet
INSERT INTO answers (question_id, content, is_correct, order_index)
SELECT 
  q.id,
  unnest(ARRAY['0.1', '0.01', '0.2', '1.0']),
  unnest(ARRAY[true, false, false, false]),
  unnest(ARRAY[0, 1, 2, 3])
FROM questions q 
WHERE q.title = 'Konverter brøken 1/10 til decimaltal';

-- Indsæt svar for 1/100 spørgsmålet
INSERT INTO answers (question_id, content, is_correct, order_index)
SELECT 
  q.id,
  unnest(ARRAY['0.01', '0.1', '0.001', '0.02']),
  unnest(ARRAY[true, false, false, false]),
  unnest(ARRAY[0, 1, 2, 3])
FROM questions q 
WHERE q.title = 'Konverter brøken 1/100 til decimaltal';

-- Indsæt svar for 2/100 spørgsmålet
INSERT INTO answers (question_id, content, is_correct, order_index)
SELECT 
  q.id,
  unnest(ARRAY['0.02', '0.2', '0.01', '0.002']),
  unnest(ARRAY[true, false, false, false]),
  unnest(ARRAY[0, 1, 2, 3])
FROM questions q 
WHERE q.title = 'Konverter brøken 2/100 til decimaltal';

-- Indsæt svar for 3/10 spørgsmålet
INSERT INTO answers (question_id, content, is_correct, order_index)
SELECT 
  q.id,
  unnest(ARRAY['0.3', '0.03', '0.33', '3.0']),
  unnest(ARRAY[true, false, false, false]),
  unnest(ARRAY[0, 1, 2, 3])
FROM questions q 
WHERE q.title = 'Konverter brøken 3/10 til decimaltal';