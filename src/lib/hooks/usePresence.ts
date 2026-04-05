'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export type CelebrationMode = 'rainbow' | 'fireworks' | 'snow' | 'confetti' | 'love' | 'zap'

interface PresenceState {
  user_id: string
  typing: boolean
}

export function usePresence(roomId: string, currentUserId: string, onCelebrateReceived?: (mode: CelebrationMode, text?: string) => void) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  const supabase = useMemo(() => createClient(), [])

  const setTyping = async (isTyping: boolean) => {
    if (channel) {
      await channel.track({
        user_id: currentUserId,
        typing: isTyping
      })
    }
  }

  const celebrate = async (mode: CelebrationMode = 'rainbow', text?: string) => {
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'celebrate',
        payload: { userId: currentUserId, mode, text }
      })
    }
  }

  const onCelebrateRef = useRef(onCelebrateReceived)
  useEffect(() => {
    onCelebrateRef.current = onCelebrateReceived
  }, [onCelebrateReceived])

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

        const allOnlineIds = new Set<string>()
        const currentlyTypingIds = new Set<string>()

        for (const [key, presences] of Object.entries(state)) {
          presences.forEach((p: any) => {
            if (p.user_id) {
              allOnlineIds.add(p.user_id)
              if (p.typing && p.user_id !== currentUserId) {
                currentlyTypingIds.add(p.user_id)
              }
            }
          })
        }

        setOnlineUsers(Array.from(allOnlineIds))
        setTypingUsers(Array.from(currentlyTypingIds))
      })
      .on('broadcast', { event: 'celebrate' }, (payload) => {
        if (onCelebrateRef.current) {
          console.log('Received celebration:', payload.payload)
          onCelebrateRef.current(
            payload.payload.mode as CelebrationMode || 'rainbow',
            payload.payload.text
          )
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await roomChannel.track({
            user_id: currentUserId,
            typing: false
          })
        }
      })

    setChannel(roomChannel)

    return () => {
      roomChannel.untrack()
      supabase.removeChannel(roomChannel)
    }
  }, [roomId, currentUserId, supabase])

  return { onlineUsers, typingUsers, setTyping, celebrate }
}
