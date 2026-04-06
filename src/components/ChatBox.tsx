'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Message, Profile, MessageReaction } from '@/types'
import { RealtimeChannel } from '@supabase/supabase-js'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { toggleReaction, scheduleMessage } from '@/app/chat/actions'
import { usePresence, CelebrationMode } from '@/lib/hooks/usePresence'
import { TypingAnimation } from './TypingAnimation'
import { useNav } from './NavigationWrapper'
import ChatHeader from './ChatHeader'
import { Room } from '@/types'
import JoinRequestsManager from './JoinRequestsManager'
import ScheduledMessagesManager from './ScheduledMessagesManager'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [celebrationText, setCelebrationText] = useState<string | null>(null)

  const triggerConfetti = (mode: CelebrationMode = 'rainbow', text?: string) => {
    if (text) {
      setCelebrationText(text)
      setTimeout(() => setCelebrationText(null), 6000)
    }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    if (mode === 'fireworks') {
      const duration = 5 * 1000
      const animationEnd = Date.now() + duration
      
      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) return clearInterval(interval)
        
        // Launch a "shell" upwards
        confetti({
          particleCount: randomInRange(30, 50),
          startVelocity: randomInRange(40, 70),
          spread: randomInRange(20, 40),
          origin: { x: randomInRange(0.1, 0.9), y: 1 }, // Always from bottom
          gravity: 1.2,
          scalar: 0.7,
          ticks: 60,
          colors: ['#ff0', '#f0f', '#0ff', '#0f0', '#f00', '#fff']
        })

        // Also add simultaneous "bursts" at random heights
        confetti({
          particleCount: randomInRange(20, 40),
          startVelocity: 15,
          spread: 360,
          origin: { x: randomInRange(0.3, 0.7), y: randomInRange(0.2, 0.5) },
          colors: ['#ffc', '#ccf', '#fcf'],
          zIndex: 9999
        })
      }, 350)
    } else if (mode === 'snow') {
      const duration = 7 * 1000
      const animationEnd = Date.now() + duration
      const frame = () => {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) return
        confetti({
          particleCount: 2,
          startVelocity: 0,
          origin: { x: Math.random(), y: Math.random() - 0.3 },
          colors: ['#fff', '#bae6fd'],
          shapes: ['circle'],
          gravity: randomInRange(0.3, 0.6),
          scalar: randomInRange(0.4, 1.2),
          drift: randomInRange(-0.5, 0.5)
        })
        requestAnimationFrame(frame)
      }
      frame()
    } else if (mode === 'confetti') {
      const duration = 3 * 1000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    } else if (mode === 'love') {
      const duration = 5 * 1000
      const end = Date.now() + duration

      // Create a heart shape from SVG path
      const heart = confetti.shapeFromPath({ 
        path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
      });

      const frame = () => {
        confetti({
          particleCount: 2,
          startVelocity: 30,
          spread: 360,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: ['#ff69b4', '#ff0000', '#ff1493', '#db7093'],
          shapes: [heart],
          scalar: randomInRange(0.5, 1.5),
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    } else if (mode === 'zap') {
      const duration = 3 * 1000
      const end = Date.now() + duration

      const interval: any = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval)
        
        // Simulate a "strike" at a random X
        const strikeX = Math.random();
        
        // Main strike bolt (very fast, sharp)
        confetti({
          particleCount: 50,
          startVelocity: 90,
          spread: 20,
          origin: { x: strikeX, y: 0 },
          colors: ['#00ffff', '#ffffff', '#7dd3fc', '#bae6fd'],
          shapes: ['square'],
          gravity: 0.2,
          scalar: 0.4,
          ticks: 30,
          angle: 270 // Straight down
        })

        // Peripheral sparks
        confetti({
          particleCount: 30,
          startVelocity: 30,
          spread: 360,
          origin: { x: strikeX, y: Math.random() * 0.5 },
          colors: ['#ffff00', '#00ffff', '#ffffff'],
          shapes: ['circle'],
          gravity: 0.8,
          scalar: 0.6,
          ticks: 30
        })

        // Second strike immediately after for "flicker" effect
        setTimeout(() => {
          confetti({
            particleCount: 20,
            startVelocity: 40,
            spread: 120,
            origin: { x: strikeX, y: Math.random() * 0.4 },
            colors: ['#ffffff', '#00ffff'],
            shapes: ['square'],
            gravity: 0.4,
            scalar: 0.3,
            ticks: 20
          })
        }, 100);

      }, 400)
    } else {
      // Default to Rainbow
      const duration = 4 * 1000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 45, spread: 360, ticks: 100, zIndex: 9999 }
      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) return clearInterval(interval)
        const particleCount = 80 * (timeLeft / duration)
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: randomInRange(0.4, 0.6) } })
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: randomInRange(0.4, 0.6) } })
      }, 250)
    }
  }

  const { onlineUsers, typingUsers: presenceTypingUsers, setTyping, celebrate } = usePresence(roomId, currentUserId, triggerConfetti)

  const handleCelebrate = async (mode: CelebrationMode = 'rainbow', text?: string) => {
    triggerConfetti(mode, text)
    await celebrate(mode, text)
  }

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
    const channel = supabase
      .channel(`realtime:messages:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        const newMessage = payload.new as Message
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

              // Show Browser Notification via Service Worker (Most reliable way)
              if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((registration) => {
                  registration.showNotification(`New message from ${finalMessage.profiles?.username || 'Someone'}`, {
                    body: finalMessage.content.length > 100 ? finalMessage.content.substring(0, 100) + '...' : finalMessage.content,
                    icon: finalMessage.profiles?.avatar_url || '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: roomId, // Groups notifications from the same chat
                    renotify: true,
                    data: { roomId } // Pass room ID for clicking
                  } as any);
                });

                // Vibrate for haptic feedback if supported (mobile)
                if ('vibrate' in navigator) {
                  navigator.vibrate([100, 50, 100]); // Short pattern: vib, pause, vib
                }
              }
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
            if (currentReactions.some(r => r.id === reaction.id)) return msg
            return { ...msg, reactions: [...currentReactions, reaction as MessageReaction] }
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

  const handleSendMessage = async (content: string, media?: Blob | File, isViewOnce?: boolean) => {
    if (!content.trim() && !media) return

    const optimisticId = crypto.randomUUID()
    const isImage = media instanceof File && media.type.startsWith('image/')
    const isAudio = media instanceof Blob && !isImage
    const optimisticMessage: Message = {
      id: optimisticId,
      room_id: roomId,
      user_id: currentUserId,
      content: isImage ? URL.createObjectURL(media as File) : content,
      audio_url: isAudio ? URL.createObjectURL(media as Blob) : undefined,
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

    setMessages((prev) => [...prev, optimisticMessage])
    setReplyingTo(null)

    let finalContent = content
    let finalAudioUrl = null

    if (media) {
      // Use the confirmed existing bucket 'voice-messages' to avoid 404 errors
      const bucket = 'voice-messages'
      
      // OPTIMIZE: Compress images on the fly before uploading
      let mediaToUpload = media;
      if (isImage && media instanceof File) {
        mediaToUpload = await compressImage(media);
      }
      
      // SANITIZE: Remove special characters from filename to avoid "InvalidKey" errors
      const safeExtension = isImage ? '.jpg' : (isAudio ? '.webm' : '.bin');
      const fileName = `${currentUserId}/${isAudio ? 'audio' : 'images'}/${optimisticId}${safeExtension}`
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(fileName, mediaToUpload)

      if (uploadError) {
        setErrorStatus(`Failed to upload media: ${uploadError.message}`)
        setTimeout(() => setErrorStatus(null), 5000)
        setMessages((prev) => prev.filter(msg => msg.id !== optimisticId))
        return
      }

      const { data: { publicUrl } } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(fileName)
      
      if (isImage) {
        finalContent = publicUrl
      } else {
        finalAudioUrl = publicUrl
      }
    }

    const finalMessagePayload = {
      ...optimisticMessage,
      content: finalContent,
      audio_url: finalAudioUrl || optimisticMessage.audio_url
    }

    if (channelRef.current) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3')
      audio.volume = 0.3
      audio.play().catch(e => console.log('Audio play failed:', e))
      await channelRef.current.send({
        type: 'broadcast',
        event: 'new_message',
        payload: finalMessagePayload
      })
    }

    const { error } = await supabase
      .from('messages')
      .insert([
        {
          id: optimisticId,
          room_id: roomId,
          user_id: currentUserId,
          content: finalContent,
          audio_url: finalAudioUrl,
          is_view_once: isViewOnce,
          is_viewed: false,
          reply_to_id: optimisticMessage.reply_to_id
        }
      ])

    if (error) {
      setErrorStatus(`Failed to save message: ${error.message}`)
      setTimeout(() => setErrorStatus(null), 5000)
      setMessages((prev) => prev.filter(msg => msg.id !== optimisticId))
    }
  }

  const handleUpdateMessage = async (messageId: string, updates: Partial<Message>) => {
    setMessages((prev) => prev.map(msg => msg.id === messageId ? { ...msg, ...updates } : msg))
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
    const { error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)
    if (error) {
      setErrorStatus(`Failed to update message: ${error.message}`)
      setTimeout(() => setErrorStatus(null), 5000)
    }
  }

  const handleDeleteMessage = async (messageId: string, audioUrl?: string) => {
    setMessages((prev) => prev.filter(msg => msg.id !== messageId))
    if (channelRef.current) {
      await channelRef.current.send({
        type: 'broadcast',
        event: 'delete_message',
        payload: { messageId }
      })
    }
    const { error: dbError } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
    if (dbError) {
      setErrorStatus(`Failed to delete message: ${dbError.message}`)
      setTimeout(() => setErrorStatus(null), 5000)
      return
    }
    if (audioUrl) {
      const pathParts = audioUrl.split('voice-messages/')
      if (pathParts.length > 1) {
        const filePath = pathParts[1]
        await supabase.storage.from('voice-messages').remove([filePath])
      }
    }
  }

  const handleTyping = (isTyping: boolean) => {
    setTyping(isTyping)
  }

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    const result = await toggleReaction(messageId, emoji)
    if (result.success) {
      const action = result.action as 'added' | 'removed'
      const reaction = result.data as MessageReaction || { message_id: messageId, user_id: currentUserId, emoji }
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
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'reaction_toggle',
          payload: { messageId, reaction, action }
        })
      }
    }
  }

  const handleScheduleMessage = async (content: string, scheduledFor: string) => {
    const result = await scheduleMessage(roomId, content, scheduledFor)
    if (result.success) {
      setErrorStatus(`Success: Message scheduled for ${new Date(scheduledFor).toLocaleString()}`)
      setTimeout(() => setErrorStatus(null), 5000)
    }
  }

  // UTILITY: High-Fidelity Client-side Image Compression
  const compressImage = async (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1200;

        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.7); // 70% quality: perfect balance of size and fidelity
      };
    });
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative">
      <AnimatePresence>
        {celebrationText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5, y: -100 }}
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center p-4"
          >
            <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md px-10 py-6 rounded-[2.5rem] border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] flex flex-col items-center gap-2">
              <span className="text-6xl mb-2">🎉</span>
              <h2 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-indigo-400 text-center tracking-tight leading-tight">
                {celebrationText}
              </h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ChatHeader
        room={roomData}
        onlineCount={onlineUsers.length}
        onlineUsers={onlineUsers}
        members={members}
        isOwner={roomData.owner_id === currentUserId}
        currentUserId={currentUserId}
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
          key={roomId}
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
        </div>
      </div>

      <MessageInput
        onSendMessage={handleSendMessage}
        onScheduleMessage={handleScheduleMessage}
        onTyping={handleTyping}
        onCelebrate={handleCelebrate}
        members={members}
        currentUserId={currentUserId}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  )
}
