-- Migration to support Public/Private rooms
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Update RLS Policies for rooms
DROP POLICY IF EXISTS "Authenticated users can view rooms" ON public.rooms;

CREATE POLICY "Users can view public rooms or rooms they are members of" 
ON public.rooms FOR SELECT 
TO authenticated 
USING (
    is_private = FALSE 
    OR 
    EXISTS (
        SELECT 1 FROM public.room_members 
        WHERE room_members.room_id = public.rooms.id 
        AND room_members.user_id = auth.uid()
    )
);
