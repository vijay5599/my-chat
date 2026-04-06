'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { createRoom, deleteRoom } from '@/app/chat/actions'
import { Room, Profile } from '@/types'
import { PlusCircle, Search, LogOut, Settings, Trash2, Lock, Clock } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { Avatar } from './Avatar'
import { useNav } from './NavigationWrapper'
import { X, PanelLeftClose } from 'lucide-react'
import clsx from 'clsx'
import { useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './ThemeToggle'

export default function Sidebar({
  rooms,
  userEmail,
  profile,
  joinedRoomIds = [],
  joinRequests = []
}: {
  rooms: Room[],
  userEmail?: string,
  profile?: Profile | null,
  joinedRoomIds?: string[],
  joinRequests?: { room_id: string, status: string }[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { setIsSidebarOpen, isMobile } = useNav()
  const [isCreating, setIsCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [search, setSearch] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Realtime rooms state
  const [localRooms, setLocalRooms] = useState<Room[]>(rooms)
  const supabase = useMemo(() => createClient(), [])
  // Unread counts state
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // Sync with props if they change (from server)
  useEffect(() => {
    setLocalRooms(rooms)
  }, [rooms])

  // Initial fetch of unread counts
  useEffect(() => {
    if (!profile?.id) return
    
    const fetchUnread = async () => {
      const { data } = await supabase
        .from('unread_message_counts' as any)
        .select('room_id, unread_count')
        .eq('user_id', profile.id)

      if (data) {
        const counts: Record<string, number> = {}
        data.forEach((item: any) => {
          counts[item.room_id] = Number(item.unread_count)
        })
        setUnreadCounts(counts)
      }
    }

    fetchUnread()
  }, [profile?.id, supabase])

  // Subscribe to room changes AND messages for unread counts
  useEffect(() => {
    if (!profile?.id) return

    const roomChannel = supabase
      .channel('sidebar-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms'
      }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setLocalRooms(prev => [payload.new as Room, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setLocalRooms(prev => prev.map(r => (r as any).id === payload.new.id ? payload.new as Room : r))
        } else if (payload.eventType === 'DELETE') {
          setLocalRooms(prev => prev.filter(r => (r as any).id !== payload.old.id))
        }
      })
      // Listen for NEW MESSAGES to update unread counts
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload: any) => {
        const newMessage = payload.new
        // Only increment if we're NOT currently in that room and it's not our own message
        if (pathname !== `/chat/${newMessage.room_id}` && newMessage.user_id !== profile.id) {
          setUnreadCounts(prev => ({
            ...prev,
            [newMessage.room_id]: (prev[newMessage.room_id] || 0) + 1
          }))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
    }
  }, [supabase, profile?.id, pathname])

  // Clear unread count when entering a room
  useEffect(() => {
    const roomId = pathname.split('/').pop()
    if (roomId && unreadCounts[roomId] > 0) {
      setUnreadCounts(prev => ({ ...prev, [roomId]: 0 }))
      // Also update database so it persists
      supabase.rpc('mark_room_as_read', { room_uuid: roomId, user_uuid: profile?.id })
    }
  }, [pathname, unreadCounts, profile?.id, supabase])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim()) return
    const formData = new FormData()
    formData.append('name', roomName)
    await createRoom(formData)
    setRoomName('')
    setIsCreating(false)
  }

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Are you sure you want to delete this room? This will remove all messages.')) return

    setIsDeleting(roomId)
    const { error } = await deleteRoom(roomId)

    if (error) {
      alert(`Failed to delete room: ${error}`)
    } else {
      // If we are currently in the deleted room, redirect to lobby
      if (pathname === `/chat/${roomId}`) {
        router.push('/chat')
      }
    }
    setIsDeleting(null)
  }

  const filteredRooms = localRooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  const channels = filteredRooms.filter(r => r.type === 'group' || !r.type)
  const dms = filteredRooms.filter(r => r.type === 'direct')

  const getDMInfo = (room: Room & { room_members?: { user_id: string, profiles: Profile }[] }) => {
    const otherMember = room.room_members?.find(m => m.user_id !== profile?.id)
    return {
      name: otherMember?.profiles?.username || 'Unknown User',
      avatar: otherMember?.profiles?.avatar_url
    }
  }

  return (
    <div className="w-72 flex flex-col h-full bg-white dark:bg-slate-900 shadow-[var(--card-shadow)] font-inter">
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between bg-white/80 dark:bg-slate-900/70 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-bold text-lg select-none">M</span>
          </div>
          <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 tracking-tight">MyChat</h2>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsCreating(true)} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors" title="Create Room">
            <PlusCircle size={18} className="text-slate-500" />
          </button>
          {!isMobile ? (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              title="Collapse Sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          ) : (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-6 pb-4">
        {isCreating && (
          <form onSubmit={handleCreateRoom} className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/30">
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-[10px] font-bold text-neutral-500 hover:text-neutral-700 uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!roomName.trim()}
                className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1.5 rounded-lg uppercase shadow-sm shadow-blue-500/20"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Channels Section */}
        <div>
          <h3 className="px-2 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rooms</h3>
          {channels.length === 0 ? (
            <p className="text-[11px] text-neutral-500 px-2 italic">Join a room to start</p>
          ) : (
            <ul className="space-y-0.5">
              {channels.map(room => {
                const isActive = pathname === `/chat/${room.id}`
                const isJoined = joinedRoomIds.includes(room.id)
                const isPending = joinRequests.some(req => req.room_id === room.id && req.status === 'pending')
                const isOwner = room.owner_id === profile?.id

                return (
                  <li key={room.id} className="group/item relative">
                    <Link
                      href={`/chat/${room.id}`}
                      onClick={(e) => {
                        if (isActive) e.preventDefault()
                        if (isMobile) setIsSidebarOpen(false)
                      }}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <div className={clsx(
                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600"
                      )}>
                        #
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate flex items-center gap-1.5 min-w-0">
                            {!isJoined && (
                              isPending
                                ? <Clock size={12} className={isActive ? "text-white" : "text-amber-500"} />
                                : <Lock size={12} className={isActive ? "text-white" : "text-slate-400"} />
                            )}
                            {room.name}
                          </p>
                          {unreadCounts[room.id] > 0 && (
                            <span className={clsx(
                              "flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold shadow-sm shrink-0 animate-in zoom-in duration-300",
                              isActive ? "bg-white text-blue-600" : "bg-red-500 text-white"
                            )}>
                              {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
                            </span>
                          )}
                        </div>
                        <p className={clsx("text-[10px] truncate", isActive ? "text-blue-100" : "text-slate-400")}>
                          Public Channel
                        </p>
                      </div>
                    </Link>

                    {isOwner && (
                      <button
                        onClick={(e) => handleDeleteRoom(e, room.id)}
                        disabled={isDeleting === room.id}
                        className={clsx(
                          "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-all opacity-0 group-hover/item:opacity-100",
                          isActive ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-red-500"
                        )}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Direct Messages Section */}
        <div>
          <h3 className="px-2 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Direct Messages</h3>
          {dms.length === 0 ? (
            <p className="text-[11px] text-neutral-500 px-2 italic">Connect with users</p>
          ) : (
            <ul className="space-y-0.5">
              {dms.map(room => {
                const isActive = pathname === `/chat/${room.id}`
                const dmInfo = getDMInfo(room as any)

                return (
                  <li key={room.id} className="group/item relative">
                    <Link
                      href={`/chat/${room.id}`}
                      onClick={(e) => {
                        if (isActive) e.preventDefault()
                        if (isMobile) setIsSidebarOpen(false)
                      }}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                        isActive
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                      )}
                    >
                      <Avatar
                        url={dmInfo.avatar}
                        name={dmInfo.name}
                        size="sm"
                        className={clsx("shrink-0", !isActive && "ring-1 ring-slate-200 dark:ring-slate-700")}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate min-w-0">
                            {dmInfo.name}
                          </p>
                          {unreadCounts[room.id] > 0 && (
                            <span className={clsx(
                              "flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold shadow-sm shrink-0 animate-in zoom-in duration-300",
                              isActive ? "bg-white text-blue-600" : "bg-red-500 text-white"
                            )}>
                              {unreadCounts[room.id] > 99 ? '99+' : unreadCounts[room.id]}
                            </span>
                          )}
                        </div>
                        <p className={clsx("text-[10px] truncate", isActive ? "text-blue-100" : "text-slate-400")}>
                          Direct Message
                        </p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <Avatar url={profile?.avatar_url} name={profile?.username || userEmail} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{profile?.username || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle />
            <button onClick={() => logout()} className="text-slate-400 hover:text-red-500 p-1.5 transition-colors" title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <Link
          href="/profile"
          className="flex items-center justify-center gap-2 py-2 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-100 dark:border-blue-900/30"
        >
          <Settings size={12} />
          Account settings
        </Link>
      </div>
    </div>
  )
}
