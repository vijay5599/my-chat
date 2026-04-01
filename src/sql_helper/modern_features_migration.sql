-- Add Read Receipt and Pinned Message support to the messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Alternatively, for more granular read tracking, one could create a message_reads table, 
-- but for a fast simple implementation, we'll use is_read.
-- In a room, is_read usually should update when another user reads it.

-- Enable realtime for the new columns if needed (it already is for messages table)
