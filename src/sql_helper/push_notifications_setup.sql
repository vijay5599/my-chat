-- Table to store push subscriptions for each user/device
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, subscription)
);

-- Index for faster lookups when sending notifications
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON public.push_subscriptions(user_id);

-- Enforce Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/manage their own subscriptions
CREATE POLICY "Users can manage their own push subscriptions" 
ON public.push_subscriptions 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
