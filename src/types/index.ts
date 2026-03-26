export interface User {
  id: string
  email: string
}

export interface Room {
  id: string
  name: string
  created_at: string
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  content: string
  created_at: string
  users?: {
    email: string
  } // usually Supabase can join on the auth.users or a profiles table, but auth.users might not be directly joinable depending on setup. Let's assume we can't join auth.users directly without a view.
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
}
