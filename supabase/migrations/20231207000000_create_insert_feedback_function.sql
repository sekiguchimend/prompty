-- Create the insert_feedback function
CREATE OR REPLACE FUNCTION insert_feedback(
  p_feedback_type TEXT,
  p_email TEXT,
  p_message TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Insert the feedback and return the result
  INSERT INTO public.feedback (
    feedback_type,
    email,
    message,
    is_read
  ) VALUES (
    p_feedback_type,
    p_email,
    p_message,
    false
  )
  RETURNING jsonb_build_object(
    'id', id,
    'feedback_type', feedback_type,
    'email', email,
    'message', message,
    'created_at', created_at
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Add comment to the function
COMMENT ON FUNCTION insert_feedback IS 'Inserts a new feedback entry and returns the created record'; 