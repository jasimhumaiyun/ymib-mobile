-- YMIB Database Reset Script
-- This will delete all bottle data and start fresh

-- Delete all bottle events first (due to foreign key constraints)
DELETE FROM bottle_events;

-- Delete all bottles
DELETE FROM bottles;

-- Reset any auto-increment sequences if they exist
-- (PostgreSQL doesn't have auto-increment, but just in case)

-- Optional: Verify the deletion
SELECT COUNT(*) as remaining_bottles FROM bottles;
SELECT COUNT(*) as remaining_events FROM bottle_events;

-- Success message
SELECT 'Database reset complete! All bottle data has been deleted.' as status; 