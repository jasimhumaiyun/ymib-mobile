-- Fix bottles table structure
-- Run this in your Supabase SQL Editor

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bottles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
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
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Make sure lat and lon are NOT NULL
ALTER TABLE bottles 
ALTER COLUMN lat SET NOT NULL;

ALTER TABLE bottles 
ALTER COLUMN lon SET NOT NULL;

-- Make sure password_hash is NOT NULL
ALTER TABLE bottles 
ALTER COLUMN password_hash SET NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS bottles_id_idx ON bottles(id);
CREATE INDEX IF NOT EXISTS bottles_status_idx ON bottles(status);
CREATE INDEX IF NOT EXISTS bottles_location_idx ON bottles(lat, lon);

-- Enable RLS
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Check final structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bottles' 
AND table_schema = 'public'
ORDER BY ordinal_position; 