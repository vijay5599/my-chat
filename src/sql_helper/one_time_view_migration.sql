-- Migration: 20260330_one_time_view_messages
-- Adds "View Once" support to the messages table.

ALTER TABLE public.messages 
ADD COLUMN is_view_once BOOLEAN DEFAULT FALSE;

ALTER TABLE public.messages 
ADD COLUMN is_viewed BOOLEAN DEFAULT FALSE;

-- Update RLS policy to allow deletion of "View Once" messages by room members.
-- This allows the recipient to trigger deletion after viewing.
CREATE POLICY "Recipient can delete view-once messages" 
ON public.messages FOR DELETE 
TO authenticated 
USING (
  is_view_once = TRUE AND 
  EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_members.room_id = messages.room_id 
    AND room_members.user_id = auth.uid()
  )
);
