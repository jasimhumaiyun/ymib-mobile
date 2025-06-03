-- YMIB Complete Database Setup
-- Copy and paste this entire file into your Supabase SQL Editor and run it

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create public profiles table
CREATE TABLE IF NOT EXISTS public_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fix bottles table structure
ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS id UUID PRIMARY KEY DEFAULT gen_random_uuid();

ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS message TEXT;

ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;

ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;

ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('adrift', 'found')) DEFAULT 'adrift';

ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public_profiles(id);

ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Create bottle_events table (CRITICAL for real-time map updates)
CREATE TABLE IF NOT EXISTS bottle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bottle_id UUID NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cast_away', 'found')),
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  user_id UUID REFERENCES public_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS bottles_id_idx ON bottles(id);
CREATE INDEX IF NOT EXISTS bottles_status_idx ON bottles(status);
CREATE INDEX IF NOT EXISTS bottles_location_idx ON bottles(lat, lon);
CREATE INDEX IF NOT EXISTS bottle_events_bottle_id_idx ON bottle_events(bottle_id);
CREATE INDEX IF NOT EXISTS bottle_events_type_idx ON bottle_events(type);

-- 6. Enable RLS on both tables
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottle_events ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for bottles
DROP POLICY IF EXISTS "Public select bottles" ON bottles;
CREATE POLICY "Public select bottles"
  ON bottles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public insert bottles" ON bottles;
CREATE POLICY "Public insert bottles"
  ON bottles FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public update bottles" ON bottles;
CREATE POLICY "Public update bottles"
  ON bottles FOR UPDATE 
  USING (true);

-- 8. Create RLS policies for bottle_events
DROP POLICY IF EXISTS "Public select bottle_events" ON bottle_events;
CREATE POLICY "Public select bottle_events"
  ON bottle_events FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Public insert bottle_events" ON bottle_events;
CREATE POLICY "Public insert bottle_events"
  ON bottle_events FOR INSERT 
  WITH CHECK (true);

-- 9. Create trigger function for new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public_profiles(id, username)
  VALUES (new.id, SPLIT_PART(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 11. Enable real-time for bottle_events (CRITICAL)
ALTER publication supabase_realtime ADD TABLE bottle_events;

-- Check that everything was created successfully
\echo 'Checking bottles table structure:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bottles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo 'Checking bottle_events table structure:'
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bottle_events' 
AND table_schema = 'public'
ORDER BY ordinal_position;

\echo 'Database setup complete! 🎉' 