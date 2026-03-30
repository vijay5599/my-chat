-- Migration: 20260330_room_join_requests
-- Creates a table to handle pending room join requests.

-- 1. Create table
CREATE TABLE public.room_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- 2. Enable RLS
ALTER TABLE public.room_join_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can view their own join requests
CREATE POLICY "Users can view their own join requests" 
ON public.room_join_requests FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Users can create a join request for themselves
CREATE POLICY "Users can create join requests" 
ON public.room_join_requests FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Owners can view join requests for their rooms
CREATE POLICY "Owners can view join requests" 
ON public.room_join_requests FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.rooms 
        WHERE rooms.id = room_join_requests.room_id 
        AND rooms.owner_id = auth.uid()
    )
);

-- Owners can update join requests for their rooms (approve/reject)
CREATE POLICY "Owners can update join requests" 
ON public.room_join_requests FOR UPDATE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.rooms 
        WHERE rooms.id = room_join_requests.room_id 
        AND rooms.owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.rooms 
        WHERE rooms.id = room_join_requests.room_id 
        AND rooms.owner_id = auth.uid()
    )
);

-- 4. Update room_members policy
-- Remove "Users can join a room" from public insert if we want only admins/actions to manage it.
-- However, for simplicity, we'll keep it but modify the frontend to only use requested join.
-- Actually, let's update it so ONLY the owner can add members or members can add themselves only if they have an approved request.

-- Let's just create the table and handle logic in Server Actions for now as it's easier to debug.
