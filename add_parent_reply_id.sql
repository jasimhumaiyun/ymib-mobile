-- Add parent_reply_id column to bottle_events table for nested replies
-- This enables replies to replies (threaded conversations)

-- Add the new column
ALTER TABLE bottle_events 
ADD COLUMN parent_reply_id UUID REFERENCES bottle_events(id);

-- Add index for better query performance on nested replies
CREATE INDEX idx_bottle_events_parent_reply_id ON bottle_events(parent_reply_id);

-- Add index for bottle_id + parent_reply_id combinations
CREATE INDEX idx_bottle_events_bottle_parent ON bottle_events(bottle_id, parent_reply_id);

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bottle_events' 
AND column_name = 'parent_reply_id';

-- Success message
SELECT 'Migration complete! parent_reply_id column added to bottle_events table.' as status; 