-- YMIB Milestone 4: Database Setup
-- Copy and paste this into your Supabase SQL Editor and run it

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create public profiles table
CREATE TABLE IF NOT EXISTS public_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add creator_id column to bottles table
ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public_profiles(id);

-- 4. Create trigger function for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public_profiles(id, username)
  VALUES (new.id, SPLIT_PART(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Enable RLS on bottles table
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
DROP POLICY IF EXISTS "Public select bottles" ON bottles;
CREATE POLICY "Public select bottles"
  ON bottles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Owner modify bottles" ON bottles;
CREATE POLICY "Owner modify bottles"
  ON bottles FOR UPDATE 
  USING (auth.uid() = creator_id);

-- 8. Create index for performance
CREATE INDEX IF NOT EXISTS bottles_id_idx ON bottles(id);

-- 9. Enable RLS on public_profiles
ALTER TABLE public_profiles ENABLE ROW LEVEL SECURITY;

-- 10. Create profile policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public_profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public_profiles;
CREATE POLICY "Users can insert their own profile"
  ON public_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public_profiles;
CREATE POLICY "Users can update own profile"
  ON public_profiles FOR UPDATE
  USING (auth.uid() = id); 