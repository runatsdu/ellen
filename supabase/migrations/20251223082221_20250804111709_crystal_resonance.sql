/*
  # Add 'brøker' tag to fraction questions

  1. New Tags
    - `brøker` (Danish for "fractions")
      - `name` (text): "brøker"
      - `description` (text): "Spørgsmål om brøker og decimaltal"
      - `color` (text): "#10b981" (emerald green)

  2. Tag Associations
    - Links all Danish fraction questions to the 'brøker' tag
    - Uses question titles to identify the fraction questions

  3. Security
    - No RLS changes needed for tags table
*/

-- Create the 'brøker' tag
INSERT INTO tags (name, description, color)
VALUES ('brøker', 'Spørgsmål om brøker og decimaltal', '#10b981')
ON CONFLICT (name) DO NOTHING;

-- Get the tag ID and associate it with all fraction questions
DO $$
DECLARE
    broker_tag_id uuid;
    question_record RECORD;
BEGIN
    -- Get the brøker tag ID
    SELECT id INTO broker_tag_id FROM tags WHERE name = 'brøker';
    
    -- Find all Danish fraction questions and add the tag
    FOR question_record IN 
        SELECT id FROM questions 
        WHERE title LIKE 'Konverter brøken % til decimaltal'
    LOOP
        -- Insert the question-tag relationship
        INSERT INTO question_tags (question_id, tag_id)
        VALUES (question_record.id, broker_tag_id)
        ON CONFLICT (question_id, tag_id) DO NOTHING;
    END LOOP;
END $$;