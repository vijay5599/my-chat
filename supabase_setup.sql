-- Supabase Setup Script for Real-time Chat App

-- 1. Create tables

-- Ensure pg_stat_statements is enabled if needed, but not required
-- Users table: we'll just rely on auth.users for foreign keys, 
-- but creating a public profiles table is usually better. 
-- For simplicity as per requirements, we'll just link directly to auth.users.

CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.room_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    UNIQUE(room_id, user_id)
);

-- 2. Turn on Row Level Security (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- ROOMS POLICIES
-- Anyone authenticated can view rooms
CREATE POLICY "Authenticated users can view rooms" 
ON public.rooms FOR SELECT 
TO authenticated 
USING (true);

-- Anyone authenticated can create a room
CREATE POLICY "Authenticated users can create rooms" 
ON public.rooms FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- ROOM MEMBERS POLICIES
-- Users can view room members of a room they are in, OR actually anyone authenticated can just see members. Let's say all authenticated can see members for simplicity.
CREATE POLICY "Authenticated users can view room members" 
ON public.room_members FOR SELECT 
TO authenticated 
USING (true);

-- Users can join a room (insert themselves)
CREATE POLICY "Users can join a room" 
ON public.room_members FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- MESSAGES POLICIES
-- Users can read messages if they are in the room
CREATE POLICY "Users can read messages in their rooms" 
ON public.messages FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.room_members 
        WHERE room_members.room_id = messages.room_id 
        AND room_members.user_id = auth.uid()
    )
);

-- Users can insert messages in rooms they are members of
CREATE POLICY "Users can insert messages in their rooms" 
ON public.messages FOR INSERT 
TO authenticated 
WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (
        SELECT 1 FROM public.room_members 
        WHERE room_members.room_id = messages.room_id 
        AND room_members.user_id = auth.uid()
    )
);

-- 4. Realtime Setup
-- Enable Realtime for messages and rooms
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
