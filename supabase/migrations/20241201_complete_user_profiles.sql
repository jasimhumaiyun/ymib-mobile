-- Complete User Profiles Migration
-- This creates a standalone user_profiles table that doesn't depend on auth.users

-- Drop existing table if it exists (for clean setup)
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table with all necessary fields
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  avatar_url TEXT,
  bio TEXT,
  total_bottles_created INTEGER NOT NULL DEFAULT 0,
  total_bottles_found INTEGER NOT NULL DEFAULT 0,
  total_bottles_retossed INTEGER NOT NULL DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_device_id ON user_profiles(device_id);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
CREATE POLICY "Allow all access to user_profiles" ON user_profiles
  FOR ALL USING (true);

-- Update bottles table to work with new user system
ALTER TABLE bottles 
  ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES user_profiles(id),
  ALTER COLUMN user_id DROP NOT NULL;

-- Update bottle_events table to work with new user system  
ALTER TABLE bottle_events 
  ADD COLUMN IF NOT EXISTS user_profile_id UUID REFERENCES user_profiles(id),
  ALTER COLUMN user_id DROP NOT NULL;

-- Create indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_bottles_user_profile_id ON bottles(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_bottle_events_user_profile_id ON bottle_events(user_profile_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to increment bottle stats
CREATE OR REPLACE FUNCTION increment_user_bottle_stat(
  user_profile_id UUID,
  stat_type TEXT
) RETURNS void AS $$
BEGIN
  CASE stat_type
    WHEN 'created' THEN
      UPDATE user_profiles 
      SET total_bottles_created = total_bottles_created + 1,
          updated_at = NOW()
      WHERE id = user_profile_id;
    WHEN 'found' THEN
      UPDATE user_profiles 
      SET total_bottles_found = total_bottles_found + 1,
          updated_at = NOW()
      WHERE id = user_profile_id;
    WHEN 'retossed' THEN
      UPDATE user_profiles 
      SET total_bottles_retossed = total_bottles_retossed + 1,
          updated_at = NOW()
      WHERE id = user_profile_id;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for user avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Allow public avatar uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Allow public avatar downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Allow public avatar updates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars');

CREATE POLICY "Allow public avatar deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars'); 