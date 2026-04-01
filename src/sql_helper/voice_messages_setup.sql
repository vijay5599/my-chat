-- 1. Add audio_url column to messages table
ALTER TABLE public.messages ADD COLUMN audio_url TEXT;

-- 2. Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-messages', 'voice-messages', true) 
ON CONFLICT (id) DO NOTHING;

-- 3. RLS Policies for the new bucket
-- Select: Anyone can view (it's a public bucket)
CREATE POLICY "Voice messages are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'voice-messages');

-- Insert: Authenticated users can upload
CREATE POLICY "Authenticated users can upload voice messages." ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'voice-messages' AND 
    auth.role() = 'authenticated'
  );

-- Delete: Users can delete their own voice messages (optional, but good practice)
CREATE POLICY "Users can delete their own voice messages." ON storage.objects
  FOR DELETE USING (
    bucket_id = 'voice-messages' AND 
    auth.uid() = owner
  );
