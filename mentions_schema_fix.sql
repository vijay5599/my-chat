-- Migration: 20260330_mentions_schema_fix
-- Fixes the foreign key relationships so PostgREST can perform joins between room_members/messages and profiles.

-- 1. Fix messages relationship
ALTER TABLE public.messages
DROP CONSTRAINT IF EXISTS messages_user_id_fkey,
ADD CONSTRAINT messages_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;

-- 2. Fix room_members relationship
ALTER TABLE public.room_members
DROP CONSTRAINT IF EXISTS room_members_user_id_fkey,
ADD CONSTRAINT room_members_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
