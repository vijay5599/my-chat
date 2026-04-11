'use client'

import { useState, useEffect, createContext, useContext, useMemo, useRef } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { Room } from '@/types'
import { usePathname } from 'next/navigation'
import NotificationToast from './NotificationToast'
import { Menu, BellRing } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavContextType {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  isMobile: boolean
  buzz: (from: string) => { success: boolean, remaining?: number }
  isBuzzing: boolean
}

const NavContext = createContext<NavContextType | undefined>(undefined)

export function useNav() {
  const context = useContext(NavContext)
  if (!context) throw new Error('useNav must be used within NavigationWrapper')
  return context
}

export default function NavigationWrapper({ 
  sidebar, 
  children,
  currentUserId,
  allRooms = []
}: { 
  sidebar: React.ReactNode
  children: React.ReactNode
  currentUserId?: string
  allRooms?: Room[]
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  
  // Notification state
  const [notification, setNotification] = useState<{
    message: string
    senderName: string
    roomName: string
    roomId: string
  } | null>(null)

  // Buzz / Ping state
  const [isBuzzing, setIsBuzzing] = useState(false)
  const [incomingBuzz, setIncomingBuzz] = useState<string | null>(null)
  const [lastBuzzTime, setLastBuzzTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [buzzAudioUrl] = useState('https://www.soundjay.com/buttons/beep-01a.mp3') // Placeholder or use the chime URL
  // Urgent Classical Digital Telephone Ring
  const CHIME_URL = 'https://assets.mixkit.co/active_storage/sfx/1350/1350-preview.mp3' 

  const buzz = (from: string) => {
    const now = Date.now()
    const COOLDOWN = 15000 // 15 seconds cooldown

    if (now - lastBuzzTime < COOLDOWN) {
      const remaining = Math.ceil((COOLDOWN - (now - lastBuzzTime)) / 1000)
      return { success: false, remaining }
    }

    setLastBuzzTime(now)
    supabase.channel('global_buzz').send({
      type: 'broadcast',
      event: 'buzz',
      payload: { from }
    })
    return { success: true }
  }

  useEffect(() => {
    if (!currentUserId) return

    const channel = supabase
      .channel('global-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages' 
      }, async (payload) => {
        const newMessage = payload.new
        
        // 1. Don't notify for our own messages
        if (newMessage.user_id === currentUserId) return
        
        // 2. Don't notify if we are already in that room
        const currentRoomId = pathname.split('/chat/')[1]
        if (newMessage.room_id === currentRoomId) return
        
        // 3. Check if we're a member (The RLS handles this, we only get events for what we can see)
        // Fetch sender profile for the toast
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', newMessage.user_id)
          .single()
        
        // 4. Find room name
        const room = allRooms.find(r => r.id === newMessage.room_id)
        
        if (profile && room) {
          setNotification({
            message: newMessage.content,
            senderName: profile.username || 'Someone',
            roomName: room.name,
            roomId: room.id
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, pathname, allRooms, supabase])

  // Global Buzz Listener
  useEffect(() => {
    if (!currentUserId) return

    const buzzChannel = supabase
      .channel('global_buzz')
      .on('broadcast', { event: 'buzz' }, ({ payload }) => {
        const { from } = payload
        
        // Don't buzz yourself
        // Wait, broadcast usually doesn't send back to self, but better safe
        
        // Trigger Screen Shake
        setIsBuzzing(true)
        setIncomingBuzz(from)
        
        // Play Sound
        if (audioRef.current) {
          audioRef.current.currentTime = 0
          audioRef.current.volume = 1.0
          audioRef.current.loop = true
          const playPromise = audioRef.current.play()
          if (playPromise !== undefined) {
            playPromise.catch(e => {
              console.log('Audio autoplay blocked by browser policy:', e)
              // We can't force play, but the visual shake and haptics will still trigger
            })
          }
        }

        setTimeout(() => setIsBuzzing(false), 1500)
        setTimeout(() => {
          setIncomingBuzz(null)
          if (audioRef.current) {
            audioRef.current.loop = false
            audioRef.current.pause()
          }
        }, 8000)

        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200, 100, 200])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(buzzChannel)
    }
  }, [currentUserId, supabase])

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setIsSidebarOpen(false)
      else setIsSidebarOpen(true)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    
    // Audio Context Priming: Unlocks sound for later use
    const primeAudio = () => {
      if (audioRef.current) {
        audioRef.current.volume = 0
        audioRef.current.play().then(() => {
          audioRef.current?.pause()
          audioRef.current!.volume = 1
        }).catch(() => {})
        window.removeEventListener('click', primeAudio)
      }
    }
    window.addEventListener('click', primeAudio)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('click', primeAudio)
    }
  }, [])

  return (
    <NavContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, isMobile, buzz, isBuzzing }}>
      <audio ref={audioRef} src={CHIME_URL} preload="auto" />
      <div className={clsx(
        "flex h-[100dvh] bg-neutral-50 dark:bg-neutral-900 text-foreground overflow-hidden relative transition-transform",
        isBuzzing && "animate-[shake_0.5s_cubic-bezier(.36,.07,.19,.97)_both]"
      )}>
        {/* Sidebar overlay for mobile */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity animate-in fade-in duration-300" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Container */}
        <div 
          className={clsx(
            "h-full z-50 transition-all duration-300 ease-in-out bg-white dark:bg-neutral-800 shrink-0",
            isMobile
              ? [
                  "fixed left-0 top-0 bottom-0 shadow-2xl w-[min(18rem,calc(100%-1.5rem))]",
                  isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                ]
              : [
                  "relative border-r dark:border-neutral-700 overflow-hidden",
                  isSidebarOpen ? "w-72 opacity-100" : "w-0 opacity-0 border-none invisible"
                ]
          )}
        >
          {/* Ensure content inside doesn't shrink on desktop */}
          <div className="w-72 h-full">
            {sidebar}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full bg-white dark:bg-black relative z-10 overflow-hidden">
          {/* Desktop Toggle Button (Only visible when sidebar is closed) */}
          {!isMobile && !isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute left-4 top-4 z-50 p-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all group animate-in slide-in-from-left duration-300"
              title="Expand Sidebar"
            >
              <Menu size={20} className="text-neutral-500 group-hover:text-blue-600 transition-colors" />
            </button>
          )}
          {children}
        </main>

        {/* Global Notifications */}
        {notification && (
          <NotificationToast 
            {...notification}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Global Buzz Toast with Silence button */}
        <AnimatePresence>
          {incomingBuzz && (
            <motion.div
              initial={{ opacity: 0, y: -50, scale: 0.8 }}
              animate={{ opacity: 1, y: 100, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="fixed top-0 left-1/2 -translate-x-1/2 z-[300] w-full max-w-xs"
            >
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-2 border-amber-500 shadow-2xl rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-amber-500/40">
                  <BellRing size={32} className="text-white animate-pulse" />
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tighter italic">BUZZ! BUZZ!</h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    <span className="text-amber-600 dark:text-amber-400">@{incomingBuzz}</span> is pinging you!
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.pause()
                      audioRef.current.currentTime = 0
                    }
                    setIncomingBuzz(null)
                  }}
                  className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-neutral-800 transition-all border-b-4 border-amber-600 active:border-b-0 active:translate-y-1 shadow-xl"
                >
                  Silence Ping
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NavContext.Provider>
  )
}
