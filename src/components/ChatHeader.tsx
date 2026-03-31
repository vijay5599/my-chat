'use client'

import { useNav } from './NavigationWrapper'
import { Menu, Clock, Users, Pencil, Check, X } from 'lucide-react'
import { Room } from '@/types'
import { useState, useEffect } from 'react'
import { renameRoom } from '@/app/chat/actions'

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
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(room.name)
  const [isSaving, setIsSaving] = useState(false)

  // Update local name if room prop changes (e.g., from realtime update)
  useEffect(() => {
    setNewName(room.name)
  }, [room.name])

  const handleSave = async () => {
    if (!newName.trim() || newName === room.name) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    const { error } = await renameRoom(room.id, newName.trim())
    if (error) {
      alert(`Error renaming room: ${error}`)
    } else {
      setIsEditing(false)
    }
    setIsSaving(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setNewName(room.name)
      setIsEditing(false)
    }
  }

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
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2 w-full max-w-md">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                autoFocus
                disabled={isSaving}
              />
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title="Save Changes"
              >
                <Check size={14} />
              </button>
              <button 
                onClick={() => {
                  setNewName(room.name)
                  setIsEditing(false)
                }}
                disabled={isSaving}
                className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group/title">
              <h2 className="font-bold text-lg md:text-xl text-slate-800 dark:text-slate-100 truncate max-w-[180px] md:max-w-none tracking-tight">
                {room.name}
              </h2>
              {isOwner && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-1 opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-blue-500 transition-all"
                  title="Rename Room"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          )}
          <p className="text-[10px] text-neutral-500 font-medium tracking-wide flex items-center gap-1.5 uppercase opacity-70">
            <span className="w-1 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full" />
            Room ID: {room.id.split('-')[0]}...
          </p>
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
