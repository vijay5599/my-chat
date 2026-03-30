'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Profile } from '@/types'

export async function createRoom(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string

  if (!name) return { error: 'Room name is required' }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('rooms')
    .insert([{ 
      name, 
      owner_id: userData.user.id 
    }])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  // Add creator to room_members
  await supabase.from('room_members').insert([
    { room_id: data.id, user_id: userData.user.id }
  ])

  revalidatePath('/chat')
  return { data }
}

export async function deleteRoom(roomId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('rooms')
    .delete()
    .eq('id', roomId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/chat')
  return { success: true }
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

export async function getRoomMembers(roomId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('room_members')
    .select('profiles(id, username, avatar_url)')
    .eq('room_id', roomId)

  if (error) {
    console.error('Error fetching room members:', error)
    return { error: error.message }
  }

  // Extract profiles from the join result
  const members = data?.map(m => m.profiles).filter(Boolean) as unknown as Profile[]
  return { data: members }
}
