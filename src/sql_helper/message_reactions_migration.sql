-- Create Message Reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reactions are viewable by everyone in the room"
ON public.message_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
ON public.message_reactions FOR DELETE
USING (auth.uid() = user_id);
