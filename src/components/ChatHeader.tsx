'use client'

import { useNav } from './NavigationWrapper'
import { Menu, Clock, Users, Pencil, Check, X, Settings, MoreVertical, Shield, Calendar, Image as ImageIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { renameRoom, getOrCreateDirectChat, toggleRoomPrivacy } from '@/app/chat/actions'
import { Room, Profile } from '@/types'
import { Avatar } from './Avatar'
import { ThemeToggle } from './ThemeToggle'
import { WallpaperPicker } from './WallpaperPicker'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

export default function ChatHeader({
  room,
  onlineCount,
  onlineUsers,
  members = [],
  isOwner,
  currentUserId,
  onManageRequests,
  onManageScheduled,
  pendingCount = 0
}: {
  room: Room,
  onlineCount: number,
  onlineUsers: string[],
  members?: Profile[],
  isOwner?: boolean,
  currentUserId: string,
  onManageRequests?: () => void,
  onManageScheduled?: () => void,
  pendingCount?: number
}) {
  const router = useRouter()
  const { isSidebarOpen, setIsSidebarOpen, isMobile } = useNav()
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState(room.name)
  const [isSaving, setIsSaving] = useState(false)
  const [isPrivacyToggling, setIsPrivacyToggling] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [isOnlineList, setIsOnlineList] = useState(false)
  const [showWallpaperPicker, setShowWallpaperPicker] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const actionsRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
  const settingsButtonRef = useRef<HTMLButtonElement>(null)

  const isDM = room.type === 'direct'
  const otherMember = members.find(m => m.id !== currentUserId)
  const roomTitle = isDM ? (otherMember?.username || 'Direct Message') : room.name

  // Map online IDs to profiles
  // Map online IDs to profiles, excluding ourselves
  const onlineMembersList = members.filter(m => onlineUsers.includes(m.id) && m.id !== currentUserId)
  const othersOnlineCount = onlineMembersList.length

  // Handle click outside to close popups
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Handle Online List
      if (
        isOnlineList &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setIsOnlineList(false)
      }

      // Handle Actions List
      if (
        showActions &&
        actionsRef.current &&
        !actionsRef.current.contains(target)
      ) {
        setShowActions(false)
      }

      // Handle Wallpaper Picker
      if (
        showWallpaperPicker &&
        settingsRef.current &&
        !settingsRef.current.contains(target) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(target)
      ) {
        setShowWallpaperPicker(false)
      }
    }

    if (isOnlineList || showWallpaperPicker || showActions) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOnlineList, showWallpaperPicker])

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

  const handleOnlineList = () => {
    setIsOnlineList(!isOnlineList)
  }

  const handleTogglePrivacy = async () => {
    setIsPrivacyToggling(true)
    const { error } = await toggleRoomPrivacy(room.id, !room.is_private)
    if (error) {
      alert(`Error updating privacy: ${error}`)
    }
    setIsPrivacyToggling(false)
  }

  return (
    <>
      <div className="relative border-b border-slate-200/70 dark:border-slate-700/70 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-white/80 dark:bg-slate-950/70 backdrop-blur-md shadow-sm z-20 font-inter">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {(isMobile || !isSidebarOpen) && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors text-neutral-500 shrink-0"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <Menu size={20} className="sm:w-[22px] sm:h-[22px]" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            {isEditing && !isDM ? (
              <div className="flex items-center gap-2 w-full max-w-md">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-2 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                  disabled={isSaving}
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shrink-0"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/title">
                {isDM && (
                  <Avatar url={otherMember?.avatar_url} name={otherMember?.username} size="sm" className="shrink-0 mr-1" />
                )}
                <h2 className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100 truncate tracking-tight">
                  {roomTitle}
                </h2>
                {isOwner && !isDM && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 sm:opacity-0 sm:group-hover/title:opacity-100 text-slate-400 hover:text-blue-500 transition-all shrink-0"
                  >
                    <Pencil size={12} className="sm:w-[14px] sm:h-[14px]" />
                  </button>
                )}
              </div>
            )}
            <p className="hidden sm:flex text-[10px] text-neutral-500 font-medium tracking-wide items-center gap-1.5 uppercase opacity-70 whitespace-nowrap">
              <span className="w-1 h-1 bg-neutral-300 dark:bg-neutral-600 rounded-full shrink-0" />
              Room ID: {room.id.split('-')[0]}...
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 pr-1 ml-4">
          {!isDM && (
            <button
              onClick={() => {
                const url = `${window.location.origin}/join/${room.id}`
                navigator.clipboard.writeText(url)
                alert('Invite link copied to clipboard!')
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-green-500/20"
              title="Copy Invitation Link"
            >
              <Check size={14} />
              Invite
            </button>
          )}

          <button
            onClick={handleOnlineList}
            className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all group"
            title="View online members"
          >
            <div className="relative">
              <span className="flex h-2 w-2 rounded-full bg-green-500" />
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
            </div>
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
              {onlineCount === 1 ? 'Just you' : `${onlineCount} online`}
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className={clsx(
                "p-2 rounded-lg transition-all",
                showActions ? "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title="Room Options"
            >
              <MoreVertical size={20} />
            </button>

            {showActions && (
              <div
                ref={actionsRef}
                className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
              >
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1.5 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Management</p>
                  </div>

                  {!isDM && (
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/join/${room.id}`
                        navigator.clipboard.writeText(url)
                        alert('Invite link copied to clipboard!')
                        setShowActions(false)
                      }}
                      className="sm:hidden w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                    >
                      <Check size={16} className="text-green-500" />
                      Copy Invite Link
                    </button>
                  )}

                  {isOwner && !isDM && (
                    <>
                      <button
                        onClick={() => {
                          onManageRequests?.()
                          setShowActions(false)
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors relative"
                      >
                        <Users size={16} className="text-blue-500" />
                        Manage Requests
                        {pendingCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                            {pendingCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          handleTogglePrivacy()
                          setShowActions(false)
                        }}
                        disabled={isPrivacyToggling}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                      >
                        <Shield size={16} className={room.is_private ? "text-amber-500" : "text-green-500"} />
                        {room.is_private ? 'Make Public' : 'Make Private'}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => {
                      onManageScheduled?.()
                      setShowActions(false)
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                  >
                    <Calendar size={16} className="text-purple-500" />
                    Scheduled Messages
                  </button>

                  <div className="h-[1px] bg-slate-100 dark:bg-slate-800 mx-2 my-1" />

                  <button
                    onClick={() => {
                      setShowWallpaperPicker(true)
                      setShowActions(false)
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                  >
                    <ImageIcon size={16} className="text-indigo-500" />
                    Theme & Wallpaper
                  </button>
                </div>
              </div>
            )}
          </div>

          {isOnlineList && (
            <div
              ref={popupRef}
              className="absolute top-full right-4 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users size={12} />
                  Online People
                </h3>
              </div>

              <div className="max-h-60 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                {othersOnlineCount === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users size={20} className="text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No one else is online right now</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {onlineMembersList.map((member) => (
                      <button
                        key={member.id}
                        onClick={async () => {
                          const result = await getOrCreateDirectChat(member.id)
                          if (result.data) {
                            router.push(`/chat/${result.data.id}`)
                            setIsOnlineList(false)
                          }
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group text-left"
                      >
                        <div className="relative shrink-0">
                          <Avatar url={member.avatar_url} name={member.username} size="sm" />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {member.username}
                          </p>
                          <p className="text-[10px] text-green-500 font-medium tracking-wide">
                            Active now
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
                <p className="text-[9px] text-center text-slate-400 uppercase font-bold tracking-tighter">
                  {othersOnlineCount === 0 ? 'You are the only member active' : `Total ${othersOnlineCount} others online`}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Wallpaper Picker Modal/Dropdown - Universal Screen Centering */}
      {showWallpaperPicker && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Global Backdrop for all screens */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setShowWallpaperPicker(false)}
          />
          <div ref={settingsRef} className="relative z-[201] w-full max-w-[340px] animate-in zoom-in-95 duration-300">
            <WallpaperPicker 
              roomId={room.id}
              currentWallpaperColor={room.wallpaper_color}
              currentWallpaperUrl={room.wallpaper_url}
              onClose={() => setShowWallpaperPicker(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
