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
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  audio_url?: string
  is_view_once?: boolean
  is_viewed?: boolean
  created_at: string
  profiles?: Profile
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
