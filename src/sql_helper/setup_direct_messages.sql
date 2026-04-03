-- 1. Add the "type" column to the rooms table
-- It defaults to 'group' so all your existing chat rooms stay functional.
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'group' CHECK (type IN ('group', 'direct'));

-- 2. Ensure all existing rooms are marked as 'group'
UPDATE rooms SET type = 'group' WHERE type IS NULL;

-- 3. (Optional but Recommended) Add an index to speed up member searches for DMs
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
