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

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="w-full bg-neutral-100 dark:bg-neutral-800 border-r dark:border-neutral-700 flex flex-col h-full">
      <div className="p-4 border-b dark:border-neutral-700 flex items-center justify-between bg-neutral-100/50 dark:bg-neutral-800/50">
        <h2 className="font-semibold text-lg">Chats</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsCreating(true)} className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors" title="Create Room">
            <PlusCircle size={18} />
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

      <div className="p-4 border-b dark:border-neutral-700">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {isCreating && (
          <form onSubmit={handleCreateRoom} className="mb-4">
            <input
              type="text"
              placeholder="Room Name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full bg-white dark:bg-neutral-900 border border-blue-500 rounded-md px-3 py-2 text-sm mb-2 focus:outline-none"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!roomName.trim()}
                className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {filteredRooms.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-4">No rooms found</p>
        ) : (
          <ul className="space-y-1">
              {filteredRooms.map(room => {
                const isActive = pathname === `/chat/${room.id}`
                const isJoined = joinedRoomIds.includes(room.id)
                const isPending = joinRequests.some(req => req.room_id === room.id && req.status === 'pending')
                
                // Fallback: If no owner is assigned yet, allow current user to delete if they are likely the owner 
                // or just show it so they can clean up existing rooms.
                const isOwner = room.owner_id === profile?.id || !room.owner_id

              return (
                <li key={room.id} className="group/item relative">
                  <Link
                    href={`/chat/${room.id}`}
                    onClick={(e) => {
                      if (isActive) {
                        e.preventDefault()
                      }
                      if (isMobile) {
                        setIsSidebarOpen(false)
                      }
                    }}
                    className={clsx(
                      "flex items-center px-3 py-2 rounded-md transition duration-200 pr-10",
                      isActive 
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500/20" 
                        : "hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate flex items-center gap-1.5">
                        {!isJoined && (
                          isPending 
                            ? <Clock size={12} className="text-yellow-500" />
                            : <Lock size={12} className="text-neutral-400" />
                        )}
                        {room.name}
                      </p>
                      <p className="text-xs text-neutral-500">{new Date(room.created_at).toLocaleDateString('en-US')}</p>
                    </div>
                  </Link>

                  {isOwner && (
                    <button
                      onClick={(e) => handleDeleteRoom(e, room.id)}
                      disabled={isDeleting === room.id}
                      className={clsx(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 transition-all disabled:opacity-50",
                        "text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md",
                        // Make only partially transperant so it's discoverable, or fully visible on mobile
                        isMobile ? "opacity-100" : "opacity-0 group-hover/item:opacity-100"
                      )}
                      title="Delete Room"
                    >
                      <Trash2 size={14} className={isDeleting === room.id ? 'animate-pulse' : ''} />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="p-4 border-t dark:border-neutral-700 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar url={profile?.avatar_url} name={profile?.username || userEmail} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.username || 'User'}</p>
            <p className="text-[10px] text-neutral-500 truncate">{userEmail}</p>
          </div>
          <button onClick={() => logout()} className="text-neutral-500 hover:text-red-500 p-1" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
        
        <Link 
          href="/profile" 
          className="flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Settings size={14} />
          Edit Profile
        </Link>
      </div>
    </div>
  )
}
