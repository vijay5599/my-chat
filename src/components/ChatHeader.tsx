'use client'

import { useNav } from './NavigationWrapper'
import { Menu, Clock, Users } from 'lucide-react'
import { Room } from '@/types'

export default function ChatHeader({ 
  room, 
  onlineCount, 
  isOwner, 
  onManageRequests,
  pendingCount = 0
}: { 
  room: Room, 
  onlineCount: number,
  isOwner?: boolean,
  onManageRequests?: () => void,
  pendingCount?: number
}) {
  const { isSidebarOpen, setIsSidebarOpen, isMobile } = useNav()

  return (
    <div className="border-b border-slate-200/70 dark:border-slate-700/70 px-6 py-4 flex items-center justify-between bg-white/80 dark:bg-slate-950/70 backdrop-blur-md shadow-[var(--card-shadow)] z-20">
      <div className="flex items-center gap-3">
        {(isMobile || !isSidebarOpen) && (
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-neutral-500"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            <Menu size={22} />
          </button>
        )}
        <div>
          <h2 className="font-semibold text-lg md:text-xl truncate max-w-[200px] md:max-w-none">
            {room.name}
          </h2>
          <p className="text-[10px] text-neutral-500 hidden md:block">Room ID: {room.id}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-4 font-inter">
        {isOwner && onManageRequests && (
          <button 
            onClick={onManageRequests}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-100 dark:border-blue-900/30 relative"
            title="Manage join requests"
          >
            <Users size={14} />
            <span className="hidden sm:inline">Requests</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-black animate-bounce">
                {pendingCount}
              </span>
            )}
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            {onlineCount} online
          </span>
        </div>
      </div>
    </div>
  )
}
