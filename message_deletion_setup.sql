-- 1. Update Messages RLS to allow deletion
CREATE POLICY "Users can delete their own messages" 
ON public.messages FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 2. Update Storage RLS for voice-messages (already in setup script, but double-checking)
-- The original voice_messages_setup.sql already included:
-- CREATE POLICY "Users can delete their own voice messages." ON storage.objects
--   FOR DELETE USING (
--     bucket_id = 'voice-messages' AND 
--     auth.uid() = owner
--   );
