-- Migration: 20260330_room_deletion
-- Adds "owner_id" to the rooms table and sets up deletion policies.

-- 1. Add owner_id column
ALTER TABLE public.rooms 
ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Update RLS policy for deletion
-- Only the owner can delete the room.
CREATE POLICY "Owners can delete their rooms" 
ON public.rooms FOR DELETE 
TO authenticated 
USING (auth.uid() = owner_id);

-- 3. (Optional) Assign existing rooms to the first member found
-- This is a one-time migration step to help with existing rooms.
UPDATE public.rooms
SET owner_id = (
  SELECT user_id 
  FROM public.room_members 
  WHERE room_members.room_id = rooms.id 
  LIMIT 1
)
WHERE owner_id IS NULL;
