'use client'

import Link from 'next/link'
import { useState, useRef } from 'react'
import { createRoom } from '@/app/chat/actions'
import { Room } from '@/types'
import { PlusCircle, Search, LogOut } from 'lucide-react'
import { logout } from '@/app/auth/actions'

export default function Sidebar({ rooms, userEmail }: { rooms: Room[], userEmail?: string }) {
  const [isCreating, setIsCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [search, setSearch] = useState('')

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim()) return
    const formData = new FormData()
    formData.append('name', roomName)
    await createRoom(formData)
    setRoomName('')
    setIsCreating(false)
  }

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="w-72 bg-neutral-100 dark:bg-neutral-800 border-r dark:border-neutral-700 flex flex-col h-full">
      <div className="p-4 border-b dark:border-neutral-700 flex items-center justify-between">
        <h2 className="font-semibold text-lg">Chats</h2>
        <button onClick={() => setIsCreating(true)} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md">
          <PlusCircle size={20} />
        </button>
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
            {filteredRooms.map(room => (
              <li key={room.id}>
                <Link
                  href={`/chat/${room.id}`}
                  className="block px-3 py-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition"
                >
                  <p className="font-medium truncate">{room.name}</p>
                  <p className="text-xs text-neutral-500">{new Date(room.created_at).toLocaleDateString('en-US')}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 border-t dark:border-neutral-700 flex items-center justify-between">
        <p className="text-sm max-w-[150px] truncate">{userEmail}</p>
        <button onClick={() => logout()} className="text-neutral-500 hover:text-red-500">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )
}
