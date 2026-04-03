'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message, Profile, MessageReaction } from '@/types'
import { RealtimeChannel } from '@supabase/supabase-js'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { toggleReaction, scheduleMessage } from '@/app/chat/actions'
import { usePresence } from '@/lib/hooks/usePresence'
import { TypingAnimation } from './TypingAnimation'
import { useNav } from './NavigationWrapper'
// import { Menu } from 'lucide-react'
// import { ReplyChips } from './ReplyChips'
// import { generateSuggestions } from '@/app/chat/ai-actions'
import ChatHeader from './ChatHeader'
import { Room } from '@/types'
import JoinRequestsManager from './JoinRequestsManager'
import ScheduledMessagesManager from './ScheduledMessagesManager'

export default function ChatBox({
  initialMessages,
  roomId,
  currentUserId,
  room,
  members
}: {
  initialMessages: Message[],
  roomId: string,
  currentUserId: string,
  room: Room,
  members: Profile[]
}) {
  const { setIsSidebarOpen, isMobile } = useNav()
  // Memoize the supabase client so its reference never changes to prevent endless WebSocket resets
  const supabase = useMemo(() => createClient(), [])
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [isManagingRequests, setIsManagingRequests] = useState(false)
  const [isManagingScheduled, setIsManagingScheduled] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [roomData, setRoomData] = useState<Room>(room)
  const { onlineUsers, typingUsers: presenceTypingUsers, setTyping } = usePresence(roomId, currentUserId)

  // Fetch pending requests count if owner
  useEffect(() => {
    if (room.owner_id !== currentUserId) return

    const fetchPendingCount = async () => {
      const { count } = await supabase
        .from('room_join_requests')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .eq('status', 'pending')
      
      setPendingCount(count || 0)
    }

    fetchPendingCount()

    // Subscribe to join request changes
    const requestChannel = supabase
      .channel(`room_requests:${roomId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'room_join_requests',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchPendingCount()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(requestChannel)
    }
  }, [roomId, currentUserId, room.owner_id, supabase])

  useEffect(() => {
    // Fetch current user profile
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single()
      if (data) setUserProfile(data)
    }
    fetchProfile()

    // Subscribe to messages via REALTIME (Postgres Changes)
    // This allows both manual and scheduled messages to show up instantly!
    const channel = supabase
      .channel(`realtime:messages:${roomId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        const newMessage = payload.new as Message
        
        // Fetch profile and other details since the DB record has IDs only
        // This makes sure the UI shows the username and avatar correctly
        const fetchMessageWithProfile = async () => {
          const { data } = await supabase
            .from('messages')
            .select('*, profiles(username, avatar_url, id), reactions:message_reactions(*, profiles(username, avatar_url, id)), replied_message:reply_to_id(*, profiles(username, avatar_url, id))')
            .eq('id', newMessage.id)
            .single()

          if (data) {
            const finalMessage = data as Message
            // Play "pop" sound for incoming messages (not from self)
            if (finalMessage.user_id !== currentUserId) {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3')
              audio.volume = 0.5
              audio.play().catch(e => console.log('Audio play failed:', e))
            }

            setMessages((prev) => {
              if (prev.some(msg => msg.id === finalMessage.id)) return prev
              return [...prev, finalMessage]
            })
          }
        }
        
        fetchMessageWithProfile()
      })
      .on('broadcast', { event: 'delete_message' }, (payload) => {
        const { messageId } = payload.payload
        setMessages((prev) => prev.filter(msg => msg.id !== messageId))
      })
      .on('broadcast', { event: 'update_message' }, (payload) => {
        const updatedMessage = payload.payload as Message
        setMessages((prev) => prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg))
      })
      .on('broadcast', { event: 'reaction_toggle' }, (payload) => {
        const { messageId, reaction, action } = payload.payload as { messageId: string, reaction: MessageReaction, action: 'added' | 'removed' }
        setMessages((prev) => prev.map(msg => {
          if (msg.id !== messageId) return msg
          const currentReactions = msg.reactions || []
          if (action === 'added') {
            // Check if already exists to prevent duplicates
            if (currentReactions.some(r => r.id === reaction.id)) return msg
            return { ...msg, reactions: [...currentReactions, reaction] }
          } else {
            return {
              ...msg,
              reactions: currentReactions.filter(r => !(r.user_id === reaction.user_id && r.emoji === reaction.emoji))
            }
          }
        }))
      })
      .subscribe()

    // Subscribe to room changes (wallpaper real-time update)
    const roomChannel = supabase
      .channel(`room_sync:${roomId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`
      }, (payload) => {
        setRoomData(payload.new as Room)
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(roomChannel)
    }
  }, [roomId, supabase, currentUserId])

  const [errorStatus, setErrorStatus] = useState<string | null>(null)

  const handleSendMessage = async (content: string, audioBlob?: Blob, isViewOnce?: boolean) => {
    if (!content.trim() && !audioBlob) return

    // Pre-generate a UUID so the Realtime event has the exact same ID, preventing duplicates
    const optimisticId = crypto.randomUUID()
    const optimisticMessage: Message = {
      id: optimisticId,
      room_id: roomId,
      user_id: currentUserId,
      content,
      audio_url: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
      is_view_once: isViewOnce,
      is_viewed: false,
      reply_to_id: replyingTo?.id || undefined,
      replied_message: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        audio_url: replyingTo.audio_url,
        profiles: replyingTo.profiles
      } : undefined,
      created_at: new Date().toISOString(),
      profiles: userProfile || undefined
    }

    // Instantly show on UI for the sender (optimistic)
    setMessages((prev) => [...prev, optimisticMessage])
    setReplyingTo(null) // Clear reply state

    let audioUrl = null
    if (audioBlob) {
      const fileName = `${currentUserId}/${optimisticId}.webm`
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('voice-messages')
        .upload(fileName, audioBlob)

      if (uploadError) {
        console.error('Error uploading voice message:', uploadError)
        setErrorStatus(`Failed to upload voice message: ${uploadError.message}`)
        setTimeout(() => setErrorStatus(null), 5000)
        setMessages((prev) => prev.filter(msg => msg.id !== optimisticId))
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('voice-messages')
        .getPublicUrl(fileName)
      
      audioUrl = publicUrl
    }

    // Prepare the message for broadcast and database
    const finalMessage = { 
      ...optimisticMessage,
      audio_url: audioUrl || optimisticMessage.audio_url 
    }

    // Broadcast message to all peers with the real URL (or optimistic content)
    if (channelRef.current) {
      // Play "pop" sound for outgoing message
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
      audio.volume = 0.3
      audio.play().catch(e => console.log('Audio play failed:', e))

      await channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: finalMessage
      })
    }

    const { error } = await supabase
      .from('messages')
      .insert([
        { 
          id: optimisticId, 
          room_id: roomId, 
          user_id: currentUserId, 
          content, 
          audio_url: audioUrl,
          is_view_once: isViewOnce,
          is_viewed: false,
          reply_to_id: optimisticMessage.reply_to_id
        }
      ])

    if (error) {
      console.error('Error sending message:', error)
      setErrorStatus(`Failed to save message: ${error.message}`)
      setTimeout(() => setErrorStatus(null), 5000)
      // Rollback on failure
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticId))
    }
  }

  const handleUpdateMessage = async (messageId: string, updates: Partial<Message>) => {
    // 1. Optimistic UI
    setMessages((prev) => prev.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg))

    // 2. Broadcast
    if (channelRef.current) {
      const messageToUpdate = messages.find(m => m.id === messageId);
      if (messageToUpdate) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'update_message',
          payload: { ...messageToUpdate, ...updates }
        })
      }
    }

    // 3. Update DB
    const { error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)

    if (error) {
      console.error('Error updating message:', error)
      setErrorStatus(`Failed to update message: ${error.message}`)
      setTimeout(() => setErrorStatus(null), 5000)
    }
  }

  const handleDeleteMessage = async (messageId: string, audioUrl?: string) => {
    // 1. Instantly update UI (optimistic)
    setMessages((prev) => prev.filter(msg => msg.id !== messageId))

    // 2. Broadcast deletion
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'delete_message',
        payload: { messageId }
      })
    }

    // 3. Delete from DB
    const { error: dbError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (dbError) {
      console.error('Error deleting message:', dbError)
      setErrorStatus(`Failed to delete message: ${dbError.message}`)
      setTimeout(() => setErrorStatus(null), 5000)
      // Note: Re-fetching might be better than manual rollback for safety
      return
    }

    // 4. Cleanup Storage
    if (audioUrl) {
      // Extract file path from URL
      // http://.../storage/v1/object/public/voice-messages/USER_ID/MESSAGE_ID.webm
      const pathParts = audioUrl.split('voice-messages/')
      if (pathParts.length > 1) {
        const filePath = pathParts[1]
        const { error: storageError } = await supabase
          .storage
          .from('voice-messages')
          .remove([filePath])
        
        if (storageError) {
          console.error('Error deleting audio file:', storageError)
        }
      }
    }
  }

  // const triggerAiSuggestions = async (currentMessages: Message[]) => {
  //   setSuggestionsLoading(true)
  //   const newSuggestions = await generateSuggestions(currentMessages)
  //   setSuggestions(newSuggestions)
  //   setSuggestionsLoading(false)
  // }

  const handleSelectSuggestion = (suggestion: string) => {
    setSuggestions([]) // Clear after selection
    handleSendMessage(suggestion)
  }

  const handleTyping = (isTyping: boolean) => {
    setTyping(isTyping)
  }

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    const result = await toggleReaction(messageId, emoji)
    
    if (result.success) {
      const action = result.action as 'added' | 'removed'
      const reaction = result.data as MessageReaction || { message_id: messageId, user_id: currentUserId, emoji }

      // 1. Optimistic UI
      setMessages((prev) => prev.map(msg => {
        if (msg.id !== messageId) return msg
        const currentReactions = msg.reactions || []
        if (action === 'added') {
          return { ...msg, reactions: [...currentReactions, reaction as MessageReaction] }
        } else {
          return { 
            ...msg, 
            reactions: currentReactions.filter(r => !(r.user_id === currentUserId && r.emoji === emoji)) 
          }
        }
      }))

      // 2. Broadcast
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'reaction_toggle',
          payload: { messageId, reaction, action }
        })
      }
    } else if (result.error) {
      console.error('Error toggling reaction:', result.error)
      setErrorStatus(`Failed to toggle reaction: ${result.error}`)
      setTimeout(() => setErrorStatus(null), 5000)
    }
  }

  const handleScheduleMessage = async (content: string, scheduledFor: string) => {
    const result = await scheduleMessage(roomId, content, scheduledFor)
    
    if (result.success) {
      setErrorStatus(`Success: Message scheduled for ${new Date(scheduledFor).toLocaleString()}`)
      setTimeout(() => setErrorStatus(null), 5000)
    } else if (result.error) {
       setErrorStatus(`Failed to schedule: ${result.error}`)
       setTimeout(() => setErrorStatus(null), 5000)
    }
  }


  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <ChatHeader 
        room={roomData} 
        onlineCount={onlineUsers.length} 
        onlineUsers={onlineUsers}
        members={members}
        isOwner={roomData.owner_id === currentUserId}
        onManageRequests={() => setIsManagingRequests(true)}
        onManageScheduled={() => setIsManagingScheduled(true)}
        pendingCount={pendingCount}
      />
      
      {isManagingRequests && (
        <JoinRequestsManager 
          roomId={roomId} 
          onClose={() => setIsManagingRequests(false)} 
        />
      )}

      {isManagingScheduled && (
        <ScheduledMessagesManager
          roomId={roomId}
          onClose={() => setIsManagingScheduled(false)}
        />
      )}
      
      {errorStatus && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-100 text-red-700 px-4 py-2 rounded-lg shadow-lg border border-red-200 text-sm animate-in fade-in slide-in-from-top-4 duration-300">
          {errorStatus}
        </div>
      )}
 
      <div 
        className="flex-1 overflow-hidden flex flex-col relative"
        style={{
          backgroundColor: roomData.wallpaper_color && !roomData.wallpaper_color.includes('gradient') ? roomData.wallpaper_color : undefined,
          backgroundImage: roomData.wallpaper_url 
            ? `url(${roomData.wallpaper_url})` 
            : (roomData.wallpaper_color?.includes('gradient') ? roomData.wallpaper_color : undefined),
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <MessageList 
          messages={messages} 
          currentUserId={currentUserId} 
          onDeleteMessage={handleDeleteMessage}
          onUpdateMessage={handleUpdateMessage}
          onReply={setReplyingTo}
          onToggleReaction={handleToggleReaction}
          members={members}
          onlineUsers={onlineUsers}
        />

        <div className="px-6 py-2 min-h-[40px] flex items-center justify-between">
          <div className="flex-1">
            {presenceTypingUsers.length > 0 && (
              <TypingAnimation 
                names={presenceTypingUsers
                  .map(id => members.find(m => m.id === id)?.username)
                  .filter(Boolean) as string[]
                } 
              />
            )}
          </div>
          {/* <ReplyChips
            suggestions={suggestions}
            onSelect={handleSelectSuggestion}
            loading={suggestionsLoading}
          /> */}
        </div>
      </div>

      <MessageInput 
        onSendMessage={handleSendMessage} 
        onScheduleMessage={handleScheduleMessage}
        onTyping={handleTyping} 
        members={members}
        currentUserId={currentUserId}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  )
}
