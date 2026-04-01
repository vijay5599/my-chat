'use client'

import { useState, useEffect, createContext, useContext, useMemo } from 'react'
import clsx from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { Room } from '@/types'
import { usePathname } from 'next/navigation'
import NotificationToast from './NotificationToast'

interface NavContextType {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  isMobile: boolean
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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setIsSidebarOpen(false)
      else setIsSidebarOpen(true)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <NavContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, isMobile }}>
      <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 text-foreground overflow-hidden relative">
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
            "h-full z-50 transition-all duration-300 ease-in-out bg-white dark:bg-neutral-800 overflow-hidden shrink-0",
            isMobile
              ? "fixed left-0 top-0 bottom-0 shadow-2xl w-[min(18rem,calc(100%-1.5rem))]"
              : "relative border-r dark:border-neutral-700",
            isSidebarOpen ? "w-72" : "w-0 border-none"
          )}
        >
          {sidebar}
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full bg-white dark:bg-black relative z-10 overflow-hidden">
          {children}
        </main>

        {/* Global Notifications */}
        {notification && (
          <NotificationToast 
            {...notification}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </NavContext.Provider>
  )
}
