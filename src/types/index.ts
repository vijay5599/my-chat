export interface User {
  id: string
  email: string
}

export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  updated_at: string
}

export interface Room {
  id: string
  name: string
  owner_id: string
  created_at: string
  wallpaper_url?: string
  wallpaper_color?: string
  type: 'group' | 'direct' | 'public'
  is_private?: boolean
  slug?: string
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
  profiles?: Profile
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  audio_url?: string
  is_view_once?: boolean
  is_viewed?: boolean
  reply_to_id?: string
  replied_message?: Partial<Message> & { profiles?: Profile }
  created_at: string
  profiles?: Profile
  reactions?: MessageReaction[]
}

export interface ScheduledMessage {
  id: string
  room_id: string
  user_id: string
  content: string
  scheduled_for: string
  sent_at: string | null
  status: 'pending' | 'sent' | 'failed'
  created_at: string
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
}

export interface RoomJoinRequest {
  id: string
  room_id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  profiles?: Profile
}
