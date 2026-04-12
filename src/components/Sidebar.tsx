'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { createRoom, deleteRoom } from '@/app/chat/actions'
import { Room, Profile } from '@/types'
import { PlusCircle, Search, LogOut, Settings, Trash2, Lock, Clock, Gamepad2, Sparkles } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { Avatar } from './Avatar'
import { useNav } from './NavigationWrapper'
import { X, PanelLeftClose } from 'lucide-react'
import clsx from 'clsx'
import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './ThemeToggle'
import { useConfirm } from '@/lib/hooks/useConfirm'
import { getRoomIdentity } from '@/lib/room-identity'

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
  const [isPrivate, setIsPrivate] = useState(false)
  const [search, setSearch] = useState('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  // Realtime rooms state
  const [localRooms, setLocalRooms] = useState<Room[]>(rooms)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const supabase = useMemo(() => createClient(), [])
  const { confirm, alert, setLoading, close } = useConfirm()

  // Sync with props if they change (from server)
  useEffect(() => {
    setLocalRooms(rooms)
  }, [rooms])

  // Subscribe to room changes
  useEffect(() => {
    if (!profile?.id) return

    const roomChannel = supabase
      .channel('sidebar-rooms')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms'
      }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setLocalRooms(prev => [payload.new as Room, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          setLocalRooms(prev => prev.map(r => r.id === payload.new.id ? payload.new as Room : r))
        } else if (payload.eventType === 'DELETE') {
          setLocalRooms(prev => prev.filter(r => r.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(roomChannel)
    }
  }, [supabase, profile?.id])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    // Small delay to let the animation play before redirect
    setTimeout(async () => {
      await logout()
    }, 800)
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim()) return
    const formData = new FormData()
    console.log(formData, "formData")
    formData.append('name', roomName)
    formData.append('is_private', isPrivate.toString())
    await createRoom(formData)
    setRoomName('')
    setIsPrivate(false)
    setIsCreating(false)
  }

  const handleDeleteRoom = async (e: React.MouseEvent, roomId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const confirmed = await confirm({
      title: 'Delete Room',
      message: 'Are you sure you want to delete this room? This will remove all messages forever.',
      confirmText: 'Delete Room',
      type: 'danger'
    })

    if (!confirmed) return

    setLoading(true)
    setIsDeleting(roomId)
    const { error } = await deleteRoom(roomId)

    if (error) {
      setLoading(false)
      alert({
        title: 'Error',
        message: `Failed to delete room: ${error}`,
        type: 'danger'
      })
    } else {
      // Small delay to show completion before closing/navigating
      setTimeout(() => {
        close()
        router.push('/chat')
        setIsDeleting(null)
      }, 500)
    }
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
      {/* NEW: QUICK ACCESS SECTION for Games */}
      <div className="px-3 py-4 border-b border-slate-100 dark:border-slate-800/50">
        <Link
          href="/chat/games"
          className={clsx(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
            pathname === '/chat/games'
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600"
          )}
        >
          <div className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-sm",
            pathname === '/chat/games' ? "bg-white/20 text-white" : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600"
          )}>
            <Gamepad2 size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">Play & Fun</p>
            <p className="text-[10px] opacity-70 truncate">Challenge your friends</p>
          </div>
        </Link>
        
        <Link
          href="/chat/aura"
          className={clsx(
            "mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden font-bold",
            pathname === '/chat/aura'
              ? "bg-slate-900 text-white shadow-xl shadow-blue-500/20"
              : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          {/* Subtle glowing aura backplate */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 animate-[pulse_3s_ease-in-out_infinite]" />
          
          <div className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm z-10",
            pathname === '/chat/aura' ? "bg-blue-600 text-white scale-110" : "bg-white dark:bg-slate-700 text-blue-600 ring-1 ring-slate-200 dark:ring-slate-600"
          )}>
            <Sparkles size={18} className={pathname === '/chat/aura' ? "" : "animate-pulse"} />
          </div>
          <div className="flex-1 min-w-0 z-10">
            <p className="text-sm font-black tracking-tight flex items-center gap-1.5">
              Aura Assistant
              <span className="text-[8px] bg-blue-500/20 text-blue-600 px-1.5 py-0.5 rounded-full uppercase">AI</span>
            </p>
            <p className="text-[10px] opacity-70 truncate italic">Private & Ephemeral</p>
          </div>
        </Link>
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
          <form
            action={async (formData) => {
              const result = await createRoom(formData);
              if (!result?.error) {
                setIsCreating(false);
                setRoomName(''); // Clear the input
                setIsPrivate(false);
              } else {
                alert({
                  title: 'Creation Failed',
                  message: result.error,
                  type: 'danger'
                })
              }
            }}
            className="mt-6 space-y-5"
          >
            <div>
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 px-1">Room Name</label>
              <input
                name="name"
                type="text"
                placeholder="e.g. Gamers HQ"
                required
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-900 border-2 border-slate-100 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all dark:text-white"
              />
            </div>
            {/* Hidden Input to send privacy state to server action */}
            <input type="hidden" name="is_private" value={isPrivate.toString()} />

            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Private Room</span>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={clsx(
                  "w-10 h-5 rounded-full transition-colors relative",
                  isPrivate ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <div className={clsx(
                  "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                  isPrivate ? "left-6" : "left-1"
                )} />
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false)
                  setIsPrivate(false)
                }}
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
                const isActive = pathname === `/chat/${room.id}` || pathname === `/chat/${room.slug}`
                const isJoined = joinedRoomIds.includes(room.id)
                const isPending = joinRequests.some(req => req.room_id === room.id && req.status === 'pending')
                const isOwner = room.owner_id === profile?.id
                const roomLink = `/chat/${room.slug || room.id}`
                const identity = getRoomIdentity(room)

                return (
                  <li key={room.id} className="group/item relative">
                    <Link
                      href={roomLink}
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
                        url={identity.avatarUrl}
                        name={room.name}
                        size="sm"
                        className={clsx("shrink-0 transition-transform group-hover:scale-110", !isActive && "ring-1 ring-slate-200 dark:ring-slate-700")}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate flex items-center gap-1.5 min-w-0">
                            {room.is_private ? (
                              <Lock size={12} className={isActive ? "text-white" : "text-slate-400"} />
                            ) : (
                              !isJoined && (
                                isPending
                                  ? <Clock size={12} className={isActive ? "text-white" : "text-amber-500"} />
                                  : <Lock size={12} className={isActive ? "text-white" : "text-slate-400"} />
                              )
                            )}
                            {room.name}
                          </p>
                        </div>
                        <p className={clsx("text-[10px] truncate", isActive ? "text-blue-100" : "text-slate-400")}>
                          {room.is_private ? 'Private Group' : 'Public Channel'}
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
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 p-1.5 transition-colors" title="Logout">
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

      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.1 }}
              className="flex flex-col items-center gap-6 text-center px-6"
            >
              <div className="relative group">
                <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center">
                  <LogOut className="text-blue-600" size={36} />
                </div>
                <motion.div
                  className="absolute -inset-4 rounded-[2.5rem] border-2 border-blue-500/40"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">Bye for now!</h3>
                <p className="text-blue-100/60 text-base max-w-[200px] leading-relaxed">Closing your secure session...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
