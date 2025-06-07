-- Add name columns to bottles and bottle_events tables
-- This enables proper creator and finder name tracking

-- Add name columns to bottles table
ALTER TABLE bottles 
ADD COLUMN IF NOT EXISTS creator_name TEXT,
ADD COLUMN IF NOT EXISTS tosser_name TEXT;

-- Add name columns to bottle_events table  
ALTER TABLE bottle_events
ADD COLUMN IF NOT EXISTS tosser_name TEXT,
ADD COLUMN IF NOT EXISTS finder_name TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bottles_creator_name ON bottles(creator_name);
CREATE INDEX IF NOT EXISTS idx_bottles_tosser_name ON bottles(tosser_name);
CREATE INDEX IF NOT EXISTS idx_bottle_events_tosser_name ON bottle_events(tosser_name);
CREATE INDEX IF NOT EXISTS idx_bottle_events_finder_name ON bottle_events(finder_name);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bottles' 
AND column_name IN ('creator_name', 'tosser_name');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bottle_events' 
AND column_name IN ('tosser_name', 'finder_name');

-- Success message
SELECT 'Migration complete! Name columns added to bottles and bottle_events tables.' as status; 