-- Remove the foreign key constraint that requires auth.users
-- This allows us to create user profiles directly without Supabase Auth
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Make the id column just a regular UUID primary key
-- (it was previously a foreign key to auth.users)
ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Update RLS policies to work with direct database users
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create new policies that work for both auth users and direct database users
CREATE POLICY "Allow profile access" ON user_profiles
  FOR ALL USING (true); -- For now, allow all access (we'll tighten this later)

-- Also update bottles and bottle_events to allow NULL user_id
-- (since we might not have auth.users for direct database users)
ALTER TABLE bottles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE bottle_events ALTER COLUMN user_id DROP NOT NULL;

-- Add indexes for better performance with username-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_username_lookup ON user_profiles(username) WHERE username IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bottles_creator_name ON bottles(creator_name) WHERE creator_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bottle_events_tosser_name ON bottle_events(tosser_name) WHERE tosser_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bottle_events_finder_name ON bottle_events(finder_name) WHERE finder_name IS NOT NULL; 