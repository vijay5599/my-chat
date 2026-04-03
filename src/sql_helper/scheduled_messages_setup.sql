-- Create scheduled_messages table
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient polling
CREATE INDEX idx_scheduled_messages_status_for ON scheduled_messages (status, scheduled_for) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own scheduled messages"
  ON scheduled_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scheduled messages"
  ON scheduled_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled messages"
  ON scheduled_messages FOR DELETE
  USING (auth.uid() = user_id);
