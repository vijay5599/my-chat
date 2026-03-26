'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message } from '@/types'
import { RealtimeChannel } from '@supabase/supabase-js'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { usePresence } from '@/lib/hooks/usePresence'
import { TypingAnimation } from './TypingAnimation'

export default function ChatBox({ 
  initialMessages, 
  roomId, 
  currentUserId 
}: { 
  initialMessages: Message[], 
  roomId: string, 
  currentUserId: string 
}) {
  // Memoize the supabase client so its reference never changes to prevent endless WebSocket resets
  const supabase = useMemo(() => createClient(), [])
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  const { onlineUsers } = usePresence(roomId, currentUserId)

  useEffect(() => {
    // Subscribe to new messages via WebSocket Broadcast (bypassing the database trigger)
    const channel = supabase
      .channel(`realtime:messages:${roomId}`)
      .on('broadcast', { event: 'new_message' }, (payload) => {
        const newMessage = payload.payload as Message
        setMessages((prev) => {
          // Prevent exact duplicate inserts
          if (prev.some(msg => msg.id === newMessage.id)) return prev
          return [...prev, newMessage]
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
  }, [roomId, supabase])

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    // Pre-generate a UUID so the Realtime event has the exact same ID, preventing duplicates
    const optimisticId = crypto.randomUUID()
    const optimisticMessage: Message = {
      id: optimisticId,
      room_id: roomId,
      user_id: currentUserId,
      content,
      created_at: new Date().toISOString()
    }

    // Instantly show on UI
    setMessages((prev) => [...prev, optimisticMessage])

    // Broadcast message to all peers instantly
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: optimisticMessage
      })
    }

    const { error } = await supabase
      .from('messages')
      .insert([
        { id: optimisticId, room_id: roomId, user_id: currentUserId, content }
      ])

    if (error) {
      console.error('Error sending message:', error)
      // Rollback on failure
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticId))
    }
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
      <div className="absolute top-2 right-4 text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full z-10">
        {onlineUsers.length} online
      </div>
      <MessageList messages={messages} currentUserId={currentUserId} />
      
      <div className="px-6 py-2 min-h-[40px] flex items-center">
        {typingUsers.length > 0 && <TypingAnimation />}
      </div>

      <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
    </div>
  )
}
