-- Create RPC function to get users with email
CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id uuid,
  full_name text,
  created_at timestamptz,
  wallet_balance numeric,
  current_plan_id uuid,
  email character varying
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.created_at,
    p.wallet_balance,
    p.current_plan_id,
    au.email
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_email() TO authenticated; 