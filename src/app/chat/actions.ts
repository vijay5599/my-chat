'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Room, Profile } from '@/types'
import { askGemini, AURA_BOT_ID } from '@/lib/gemini'
import { askOpenAI } from '@/lib/openai'
import { generateFreeImage } from '@/lib/art'

export async function createRoom(formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const isPrivate = formData.get('is_private') === 'true'

  if (!name) return { error: 'Room name is required' }

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'Not authenticated' }

  // Generate a slug from name
  const baseSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const randomSuffix = Math.random().toString(36).substring(2, 6)
  const slug = `${baseSlug}-${randomSuffix}`

  const { data, error } = await supabase
    .from('rooms')
    .insert([{ 
      name, 
      owner_id: userData.user.id,
      type: 'group',
      is_private: isPrivate,
      slug: slug
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
  redirect(`/chat/${data.slug}`)
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

export async function renameRoom(roomId: string, newName: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('rooms')
    .update({ name: newName })
    .eq('id', roomId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/chat')
  revalidatePath(`/chat/${roomId}`)
  return { success: true }
}

export async function toggleReaction(messageId: string, emoji: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from('message_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .single()

  if (existing) {
    // Delete existing
    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('id', existing.id)

    if (error) return { error: error.message }
    return { success: true, action: 'removed' }
  } else {
    // Insert new
    const { data, error } = await supabase
      .from('message_reactions')
      .insert([{
        message_id: messageId,
        user_id: user.id,
        emoji
      }])
      .select('*, profiles(id, username, avatar_url)')
      .single()

    if (error) return { error: error.message }
    return { success: true, action: 'added', data }
  }
}

export async function updateRoomWallpaper(roomId: string, wallpaperData: { url?: string, color?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify ownership or DM membership
  const { data: room } = await supabase.from('rooms').select('owner_id, type').eq('id', roomId).single()
  if (!room) return { error: 'Room not found' }

  if (room.owner_id !== user.id && room.type !== 'direct') {
    return { error: 'Only the room owner can change the wallpaper' }
  }

  const { error } = await supabase
    .from('rooms')
    .update({ 
      wallpaper_url: wallpaperData.url, 
      wallpaper_color: wallpaperData.color 
    })
    .eq('id', roomId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/chat/${roomId}`)
  revalidatePath('/chat')
  return { success: true }
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  // 1. Get joined rooms count
  const { count: roomsCount } = await supabase
    .from('room_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 2. Get user's total messages
  const { count: messagesCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 3. Get total members in system (example of global stat)
  const { count: totalMembers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })

  // 4. Get recent joined rooms (last 3)
  const { data: recentRooms } = await supabase
    .from('room_members')
    .select('room_id, rooms(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const rooms = recentRooms?.map(r => r.rooms).filter(Boolean) || []

  return {
    roomsCount: roomsCount || 0,
    messagesCount: messagesCount || 0,
    totalMembers: totalMembers || 0,
    recentRooms: rooms as any[]
  }
}

export async function scheduleMessage(roomId: string, content: string, scheduledFor: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('scheduled_messages')
    .insert([{
      room_id: roomId,
      user_id: user.id,
      content,
      scheduled_for: scheduledFor,
      status: 'pending'
    }])
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  return { success: true, data }
}

export async function getScheduledMessages(roomId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('scheduled_messages')
    .select('*')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true })

  if (error) return { error: error.message }
  return { data }
}

export async function cancelScheduledMessage(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('scheduled_messages')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }
  return { success: true }
}
export async function getOrCreateDirectChat(otherUserId: string) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'Not authenticated' }
  const currentUserId = userData.user.id

  // 1. Find if a direct room already exists between these two users
  // We look for rooms where both users are members and room type is 'direct'
  const { data: existingRooms, error: searchError } = await supabase
    .from('room_members')
    .select('room_id, rooms!inner(id, type)')
    .eq('user_id', currentUserId)
    .eq('rooms.type', 'direct')

  if (searchError) return { error: searchError.message }

  // Of those rooms where current user is a member, which one also has the other user?
  for (const userRoom of existingRooms || []) {
    const { data: otherMember } = await supabase
      .from('room_members')
      .select('id')
      .eq('room_id', userRoom.room_id)
      .eq('user_id', otherUserId)
      .single()

    if (otherMember) {
      return { data: { id: userRoom.room_id } }
    }
  }

  // 2. If no room exists, create a new 'direct' room
  // Use a generic name, we'll override it in the UI with the other person's name
  const { data: newRoom, error: createError } = await supabase
    .from('rooms')
    .insert([{ 
      name: `dm-${currentUserId}-${otherUserId}`, 
      owner_id: currentUserId,
      type: 'direct'
    }])
    .select()
    .single()

  if (createError) return { error: createError.message }

  // 3. Add both users to the new room
  await supabase.from('room_members').insert([
    { room_id: newRoom.id, user_id: currentUserId },
    { room_id: newRoom.id, user_id: otherUserId }
  ])

  revalidatePath('/chat')
  return { data: newRoom }
}

export async function getRoomsWithProfiles() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return { error: 'Not authenticated' }

  // Fetch rooms where the user is a member, including the other member's profile for DMs
  const { data, error } = await supabase
    .from('room_members')
    .select(`
      room_id,
      rooms (
        id,
        name,
        slug,
        type,
        is_private,
        wallpaper_url,
        wallpaper_color,
        created_at,
        owner_id,
        room_members (
          user_id,
          profiles (
            id,
            username,
            avatar_url
          )
        )
      )
    `)
    .eq('user_id', userData.user.id)

  if (error) return { error: error.message }

  // Format the data to return a list of rooms
  const rooms = data.map(item => item.rooms).filter(Boolean) as unknown as (Room & { room_members: { profiles: Profile }[] })[]
  return { data: rooms }
}

export async function toggleRoomPrivacy(roomId: string, isPrivate: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }

  // Check if owner
  const { data: room } = await supabase
    .from('rooms')
    .select('owner_id')
    .eq('id', roomId)
    .single()

  if (!room || room.owner_id !== user.id) {
    return { error: 'Unauthorized: Only the owner can change privacy settings' }
  }

  const { error } = await supabase
    .from('rooms')
    .update({ is_private: isPrivate })
    .eq('id', roomId)

  if (error) return { error: error.message }

  revalidatePath('/chat')
  revalidatePath(`/chat/${roomId}`)
  return { success: true }
}

export async function processAuraMention(roomId: string, userMessage: string) {
  const supabase = await createAdminClient()
  
  // 1. Get room details to find a valid sender (Owner)
  const { data: room } = await supabase
    .from('rooms')
    .select('owner_id')
    .eq('id', roomId)
    .single()

  if (!room) return { error: 'Room not found' }

  // 2. Clean Message
  const prompt = userMessage.replace(/@aura/gi, '').trim()
  
  // 3. System Personality
  const systemPrompt = `You are Aura, the soulful and intelligent AI guardian of this chat application. 
  Your personality is calm, mystical, yet highly helpful. You speak with a touch of poetic elegance but remain concise.
  You are part of the Aura chat ecosystem. Never mention you are a model from Google.
  Goal: Help the user and maintain the "vibe" of the room.`

  try {
    let aiResponse = ''
    
    // Check if user wants an image (Improved detection)
    const isImageRequest = /\b(generate|create|make|show|paint|draw)\b/i.test(prompt) && 
                          !/\b(list|code|text|story|poem|song|recipe|how to)\b/i.test(prompt);
    
    if (isImageRequest) {
      // Clean the prompt to remove "generate a [subject]" junk
      const cleanPrompt = prompt
        .replace(/\b(generate|create|make|show|paint|draw)\b\s+(a|an|the)?/i, '')
        .trim()
        .replace(/^["']|["']$/g, '');
        
      aiResponse = await generateFreeImage(cleanPrompt || prompt) // USE FREE ENGINE (HF)
    } else {
      // Switch to OpenAI for Chat to avoid Gemini 503 errors
      aiResponse = await askOpenAI(prompt, systemPrompt)
    }
    
    // 4. Save Bot Message 
    // We use the AURA_BOT_ID. If it fails due to FK constraints, we use the room owner 
    // but the UI will handle the '@aura' display by checking the content or a special flag if we had one.
    // However, the best way is to try and find if an 'aura' profile exists.
    
    const { data: botProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', 'aura')
      .single()

    const senderId = botProfile?.id || AURA_BOT_ID

    const { data: message, error } = await supabase
      .from('messages')
      .insert([{
        room_id: roomId,
        user_id: senderId,
        content: aiResponse // RAW URL if it's an image
      }])
      .select('*, profiles(username, avatar_url, id)')
      .single()

    // If the fake AURA_BOT_ID failed, fallback to owner_id so the message at least saves
    if (error && error.code === '23503') {
       const { data: fallbackMsg, error: fallbackErr } = await supabase
        .from('messages')
        .insert([{
          room_id: roomId,
          user_id: room.owner_id, // Use owner as proxy
          content: isImageRequest ? aiResponse : `✨ **Aura AI:** ${aiResponse}` // No prefix for images
        }])
        .select('*, profiles(username, avatar_url, id)')
        .single()
       
       if (fallbackErr) throw fallbackErr
       return { success: true, data: fallbackMsg }
    }

    if (error) throw error

    return { success: true, data: message }
  } catch (error) {
    console.error('Aura AI Error:', error)
    return { error: 'Aura is temporarily resting in the ether.' }
  }
}

export async function generateRoomAiIdentity(roomId: string, roomName: string) {
  // System Prompt for Room Identity
  const systemPrompt = `You are the Aura Room Identity Designer. 
  Based on the room name "${roomName}", generate a soulful identity.
  Return a JSON object with:
  - motto (short, maximum 10 words)
  - vibe (one or two words, e.g. "Zen", "High-Octane")
  - gradient (An array of 2-3 Hex color codes that make a beautiful gradient, e.g. ["#4f46e5", "#c026d3"])
  Make it creative and unique.
  Return ONLY the JSON.`

  try {
    const response = await askGemini(`Generate identity for room: ${roomName}`, systemPrompt, true)
    
    // Robust JSON extraction
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid AI response');
    
    const identity = JSON.parse(jsonMatch[0])

    const gradientStr = `linear-gradient(135deg, ${identity.gradient.join(', ')})`

    // Update room wallpaper color with the new AI gradient
    const supabase = await createAdminClient()
    await supabase
      .from('rooms')
      .update({ 
        wallpaper_color: gradientStr
      })
      .eq('id', roomId)

    revalidatePath(`/chat/${roomId}`)
    return { success: true, identity }
  } catch (error) {
    console.error('AI Identity Error:', error)
    return { error: 'Could not generate identity at this time.' }
  }
}

export async function askAuraAssistant(message: string) {
  const systemPrompt = `You are Aura, the user's private AI assistant. 
  You are helpful, insightful, and maintain a premium, soulful vibe.
  This is a private, ephemeral chat. Your goal is to assist the user with any questions or tasks.
  Keep responses concise and well-formatted.`

  try {
    // Check if user wants an image (Improved detection)
    const isImageRequest = /\b(generate|create|make|show|paint|draw)\b/i.test(message) && 
                          !/\b(list|code|text|story|poem|song|recipe|how to)\b/i.test(message);
    
    if (isImageRequest) {
      const cleanPrompt = message
        .replace(/\b(generate|create|make|show|paint|draw)\b\s+(a|an|the)?/i, '')
        .trim()
        .replace(/^["']|["']$/g, '');
        
      const imageUrl = await generateFreeImage(cleanPrompt || message) // USE FREE ENGINE (HF)
      return { success: true, text: imageUrl }
    }

    // Switch to OpenAI for Chat to avoid Gemini 503 errors
    const response = await askOpenAI(message, systemPrompt)
    return { success: true, text: response }
  } catch (error) {
    console.error('Aura Assistant Error:', error)
    return { error: 'Aura is momentarily disconnected.' }
  }
}
