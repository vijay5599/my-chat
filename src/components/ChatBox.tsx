'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message, Profile } from '@/types'
import { RealtimeChannel } from '@supabase/supabase-js'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { usePresence } from '@/lib/hooks/usePresence'
import { TypingAnimation } from './TypingAnimation'
import { useNav } from './NavigationWrapper'
// import { Menu } from 'lucide-react'
// import { ReplyChips } from './ReplyChips'
// import { generateSuggestions } from '@/app/chat/ai-actions'
import ChatHeader from './ChatHeader'
import { Room } from '@/types'

export default function ChatBox({
  initialMessages,
  roomId,
  currentUserId,
  room
}: {
  initialMessages: Message[],
  roomId: string,
  currentUserId: string,
  room: Room
}) {
  const { setIsSidebarOpen, isMobile } = useNav()
  // Memoize the supabase client so its reference never changes to prevent endless WebSocket resets
  const supabase = useMemo(() => createClient(), [])
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const { onlineUsers } = usePresence(roomId, currentUserId)

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

    // Subscribe to new messages via WebSocket Broadcast (bypassing the database trigger)
    const channel = supabase
      .channel(`realtime:messages:${roomId}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const newMessage = payload.payload as Message
        setMessages((prev) => {
          // Prevent exact duplicate inserts
          if (prev.some(msg => msg.id === newMessage.id)) return prev

          const newMessages = [...prev, newMessage]

          // Trigger AI suggestions if the message is from someone else
          // if (newMessage.user_id !== currentUserId) {
          //   triggerAiSuggestions(newMessages)
          // }

          return newMessages
        })
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        const { userId, isTyping } = payload.payload
        if (userId === currentUserId) return

        setTypingUsers((prev) => {
          if (isTyping) {
            if (prev.includes(userId)) return prev
            return [...prev, userId]
          } else {
            return prev.filter(id => id !== userId)
          }
        })
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, supabase, currentUserId])

  const [errorStatus, setErrorStatus] = useState<string | null>(null)

  const handleSendMessage = async (content: string, audioBlob?: Blob) => {
    if (!content.trim() && !audioBlob) return

    // Pre-generate a UUID so the Realtime event has the exact same ID, preventing duplicates
    const optimisticId = crypto.randomUUID()
    const optimisticMessage: Message = {
      id: optimisticId,
      room_id: roomId,
      user_id: currentUserId,
      content,
      audio_url: audioBlob ? URL.createObjectURL(audioBlob) : undefined,
      created_at: new Date().toISOString(),
      profiles: userProfile || undefined
    }

    // Instantly show on UI for the sender (optimistic)
    setMessages((prev) => [...prev, optimisticMessage])

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
          audio_url: audioUrl 
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
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping }
      })
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <ChatHeader room={room} onlineCount={onlineUsers.length} />
      
      {errorStatus && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-red-100 text-red-700 px-4 py-2 rounded-lg shadow-lg border border-red-200 text-sm animate-in fade-in slide-in-from-top-4 duration-300">
          {errorStatus}
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <MessageList messages={messages} currentUserId={currentUserId} />

        <div className="px-6 py-2 min-h-[40px] flex items-center justify-between">
          <div className="flex-1">
            {typingUsers.length > 0 && <TypingAnimation />}
          </div>
          {/* <ReplyChips
            suggestions={suggestions}
            onSelect={handleSelectSuggestion}
            loading={suggestionsLoading}
          /> */}
        </div>
      </div>

      <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
    </div>
  )
}
