'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface PresenceState {
  user_id: string
  typing: boolean
}

export function usePresence(roomId: string, currentUserId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const roomChannel = supabase.channel(`room_${roomId}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    })

    roomChannel
      .on('presence', { event: 'sync' }, () => {
        const state = roomChannel.presenceState<PresenceState>()
        
        const allOnlineIds: string[] = []
        const currentlyTypingIds: string[] = []
        
        for (const [key, presences] of Object.entries(state)) {
          // presences is an array of PresenceState for that particular key
          const presence = presences[0]
          
          if (presence) {
            allOnlineIds.push(presence.user_id)
            if (presence.typing && presence.user_id !== currentUserId) {
              currentlyTypingIds.push(presence.user_id)
            }
          }
        }
        
        setOnlineUsers(allOnlineIds)
        setTypingUsers(currentlyTypingIds)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            user_id: currentUserId,
            typing: false,
          })
        }
      })

    setChannel(roomChannel)

    return () => {
      supabase.removeChannel(roomChannel)
    }
  }, [roomId, currentUserId, supabase])

  const setTyping = async (isTyping: boolean) => {
    if (channel) {
      await channel.track({
        user_id: currentUserId,
        typing: isTyping,
      })
    }
  }

  return { onlineUsers, typingUsers, setTyping }
}
