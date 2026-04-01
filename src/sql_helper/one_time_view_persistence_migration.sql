-- Migration: 20260330_one_time_view_persistence
-- Updates the "View Once" behavior to allow updates instead of just deletion.

-- 1. Add Update Policy for recipients
-- Allow members of the room to update 'is_viewed' and 'content' for view-once messages.
CREATE POLICY "Recipient can mark view-once messages as viewed" 
ON public.messages FOR UPDATE 
TO authenticated 
USING (
  is_view_once = TRUE AND 
  EXISTS (
    SELECT 1 FROM public.room_members 
    WHERE room_members.room_id = messages.room_id 
    AND room_members.user_id = auth.uid()
  )
)
WITH CHECK (
  is_viewed = TRUE AND 
  content = '' -- Force clearing content for privacy
);
