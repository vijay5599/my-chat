'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRoom(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  if (!name) return { error: 'Room name is required' }

  const { data, error } = await supabase
    .from('rooms')
    .insert([{ name }])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Add creator to room_members
  const { data: userData } = await supabase.auth.getUser()
  if (userData.user) {
    await supabase.from('room_members').insert([
      { room_id: data.id, user_id: userData.user.id }
    ])
  }

  revalidatePath('/chat')
  return { data }
}

export async function joinRoom(roomId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  
  if (!userData.user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('room_members').insert([
    { room_id: roomId, user_id: userData.user.id }
  ])

  // Ignore unique constraint errors if already joined
  if (error && error.code !== '23505') {
    return { error: error.message }
  }

  return { success: true }
}
