/*
  # Add Basic Fraction to Decimal Questions

  1. New Questions
    - Creates 8 questions about converting fractions to decimals
    - Each question focuses on a specific fraction (1/2, 1/3, 1/4, 1/5, 1/10, 1/100, 2/100, 3/10)
    - Multiple choice answers with one correct answer each
    - All questions assigned to Mathematics course

  2. Question Structure
    - Clear titles indicating the fraction to convert
    - Detailed content explaining the task
    - 4 multiple choice answers per question
    - Proper ordering of answers

  3. Course Assignment
    - All questions assigned to Mathematics course
    - If Mathematics doesn't exist, questions will have null course_id
*/

-- Insert fraction to decimal questions
DO $$
DECLARE
    math_course_id uuid;
    teacher_id uuid;
    question_id uuid;
BEGIN
    -- Get Mathematics course ID (if it exists)
    SELECT id INTO math_course_id FROM courses WHERE name = 'Mathematics' LIMIT 1;
    
    -- Get a teacher ID (use the first available teacher)
    SELECT id INTO teacher_id FROM teachers LIMIT 1;
    
    -- If no teacher exists, create a default one for these questions
    IF teacher_id IS NULL THEN
        INSERT INTO teachers (email) VALUES ('system@school.edu') RETURNING id INTO teacher_id;
    END IF;

    -- Question 1: Convert 1/2 to decimal
    INSERT INTO questions (title, content, course_id, teacher_id) 
    VALUES ('Convert 1/2 to a decimal number', 'Convert the fraction 1/2 to its decimal equivalent. Remember that fractions represent division, so 1/2 means 1 ÷ 2.', math_course_id, teacher_id)
    RETURNING id INTO question_id;
    
    INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
    (question_id, '0.5', true, 0),
    (question_id, '0.2', false, 1),
    (question_id, '0.25', false, 2),
    (question_id, '0.1', false, 3);

    -- Question 2: Convert 1/3 to decimal
    INSERT INTO questions (title, content, course_id, teacher_id) 
    VALUES ('Convert 1/3 to a decimal number', 'Convert the fraction 1/3 to its decimal equivalent. This fraction creates a repeating decimal, so choose the best approximation.', math_course_id, teacher_id)
    RETURNING id INTO question_id;
    
    INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
    (question_id, '0.333...', true, 0),
    (question_id, '0.3', false, 1),
    (question_id, '0.25', false, 2),
    (question_id, '0.5', false, 3);

    -- Question 3: Convert 1/4 to decimal
    INSERT INTO questions (title, content, course_id, teacher_id) 
    VALUES ('Convert 1/4 to a decimal number', 'Convert the fraction 1/4 to its decimal equivalent. Think about what 1 ÷ 4 equals.', math_course_id, teacher_id)
    RETURNING id INTO question_id;
    
    INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
    (question_id, '0.25', true, 0),
    (question_id, '0.4', false, 1),
    (question_id, '0.5', false, 2),
    (question_id, '0.2', false, 3);

    -- Question 4: Convert 1/5 to decimal
    INSERT INTO questions (title, content, course_id, teacher_id) 
    VALUES ('Convert 1/5 to a decimal number', 'Convert the fraction 1/5 to its decimal equivalent. Remember that 1/5 means 1 ÷ 5.', math_course_id, teacher_id)
    RETURNING id INTO question_id;
    
    INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
    (question_id, '0.2', true, 0),
    (question_id, '0.5', false, 1),
    (question_id, '0.25', false, 2),
    (question_id, '0.15', false, 3);

    -- Question 5: Convert 1/10 to decimal
    INSERT INTO questions (title, content, course_id, teacher_id) 
    VALUES ('Convert 1/10 to a decimal number', 'Convert the fraction 1/10 to its decimal equivalent. This is one of the easiest fractions to convert!', math_course_id, teacher_id)
    RETURNING id INTO question_id;
    
    INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
    (question_id, '0.1', true, 0),
    (question_id, '0.01', false, 1),
    (question_id, '0.2', false, 2),
    (question_id, '1.0', false, 3);

    -- Question 6: Convert 1/100 to decimal
    INSERT INTO questions (title, content, course_id, teacher_id) 
    VALUES ('Convert 1/100 to a decimal number', 'Convert the fraction 1/100 to its decimal equivalent. Think about what one hundredth means in decimal form.', math_course_id, teacher_id)
    RETURNING id INTO question_id;
    
    INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
    (question_id, '0.01', true, 0),
    (question_id, '0.1', false, 1),
    (question_id, '0.001', false, 2),
    (question_id, '1.00', false, 3);

    -- Question 7: Convert 2/100 to decimal
    INSERT INTO questions (title, content, course_id, teacher_id) 
    VALUES ('Convert 2/100 to a decimal number', 'Convert the fraction 2/100 to its decimal equivalent. This fraction can also be simplified before converting.', math_course_id, teacher_id)
    RETURNING id INTO question_id;
    
    INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
    (question_id, '0.02', true, 0),
    (question_id, '0.2', false, 1),
    (question_id, '0.002', false, 2),
    (question_id, '2.0', false, 3);

    -- Question 8: Convert 3/10 to decimal
    INSERT INTO questions (title, content, course_id, teacher_id) 
    VALUES ('Convert 3/10 to a decimal number', 'Convert the fraction 3/10 to its decimal equivalent. Remember that the denominator 10 makes this conversion straightforward.', math_course_id, teacher_id)
    RETURNING id INTO question_id;
    
    INSERT INTO answers (question_id, content, is_correct, order_index) VALUES
    (question_id, '0.3', true, 0),
    (question_id, '0.03', false, 1),
    (question_id, '3.0', false, 2),
    (question_id, '0.13', false, 3);

END $$;