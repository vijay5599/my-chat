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

export async function requestToJoinRoom(roomId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  
  if (!userData.user) return { error: 'Not authenticated' }

  // Check if already a member first (optional, DB has unique constraint)
  const { data: member } = await supabase
    .from('room_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userData.user.id)
    .single()

  if (member) return { error: 'Already a member' }

  const { error } = await supabase.from('room_join_requests').insert([
    { room_id: roomId, user_id: userData.user.id, status: 'pending' }
  ])

  // Ignore unique constraint errors if already requested
  if (error && error.code !== '23505') {
    return { error: error.message }
  }

  return { success: true }
}

export async function getPendingRequests(roomId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('room_join_requests')
    .select('*, profiles(id, username, avatar_url)')
    .eq('room_id', roomId)
    .eq('status', 'pending')

  if (error) return { error: error.message }
  
  return { data }
}

export async function approveJoinRequest(requestId: string) {
  const supabase = await createClient()
  
  // 1. Get the request details
  const { data: request, error: fetchError } = await supabase
    .from('room_join_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (fetchError || !request) return { error: 'Request not found' }

  // 2. Add as member
  const { error: memberError } = await supabase
    .from('room_members')
    .insert([{ room_id: request.room_id, user_id: request.user_id }])

  if (memberError && memberError.code !== '23505') {
    return { error: memberError.message }
  }

  // 3. Mark request as approved (or just delete it, but let's update)
  await supabase
    .from('room_join_requests')
    .update({ status: 'approved' })
    .eq('id', requestId)

  revalidatePath(`/chat/${request.room_id}`)
  return { success: true }
}

export async function rejectJoinRequest(requestId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('room_join_requests')
    .update({ status: 'rejected' })
    .eq('id', requestId)

  if (error) return { error: error.message }
  
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
