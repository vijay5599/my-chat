'use client'

import { useNav } from './NavigationWrapper'
import { Menu } from 'lucide-react'
import { Room } from '@/types'

export default function ChatHeader({ room, onlineCount }: { room: Room, onlineCount: number }) {
  const { isSidebarOpen, setIsSidebarOpen, isMobile } = useNav()

  return (
    <div className="border-b px-6 py-4 flex items-center justify-between shadow-sm bg-white dark:bg-black z-20">
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
      
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          {onlineCount} online
        </span>
      </div>
    </div>
  )
}
