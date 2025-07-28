-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Update existing profiles with email from auth.users
UPDATE profiles 
SET email = auth_users.email 
FROM auth.users auth_users 
WHERE profiles.id = auth_users.id;

-- Create a trigger to automatically update email when user is created/updated
CREATE OR REPLACE FUNCTION update_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email in profiles when auth.users is updated
  UPDATE profiles 
  SET email = NEW.email 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trigger_update_profile_email_insert ON auth.users;
CREATE TRIGGER trigger_update_profile_email_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_email();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS trigger_update_profile_email_update ON auth.users;
CREATE TRIGGER trigger_update_profile_email_update
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_email();

-- Grant necessary permissions
GRANT UPDATE ON profiles TO authenticated; 