'use client'

import { useState, useEffect } from 'react'
import { RoomJoinRequest, Profile } from '@/types'
import { getPendingRequests, approveJoinRequest, rejectJoinRequest } from '@/app/chat/actions'
import { Check, X, User as UserIcon, Clock } from 'lucide-react'
import { Avatar } from './Avatar'

export default function JoinRequestsManager({ 
  roomId, 
  onClose 
}: { 
  roomId: string, 
  onClose: () => void 
}) {
  const [requests, setRequests] = useState<RoomJoinRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadRequests() {
      const { data, error } = await getPendingRequests(roomId)
      if (data) setRequests(data as RoomJoinRequest[])
      setLoading(false)
    }
    loadRequests()
  }, [roomId])

  const handleApprove = async (id: string) => {
    const { success } = await approveJoinRequest(id)
    if (success) {
      setRequests(prev => prev.filter(r => r.id !== id))
    }
  }

  const handleReject = async (id: string) => {
    const { success } = await rejectJoinRequest(id)
    if (success) {
      setRequests(prev => prev.filter(r => r.id !== id))
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl shadow-2xl border dark:border-neutral-800 overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-blue-500" />
            <h3 className="text-xl font-bold">Join Requests</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-neutral-500">Loading requests...</div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 space-y-2">
              <div className="mx-auto w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-2">
                <Check size={24} className="text-neutral-400" />
              </div>
              <p className="font-medium">No pending requests</p>
              <p className="text-sm opacity-70">Everything is up to date!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div 
                  key={req.id} 
                  className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border dark:border-neutral-800 transition-all hover:border-blue-200 dark:hover:border-blue-900/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar url={req.profiles?.avatar_url} name={req.profiles?.username} size="sm" />
                    <div>
                      <p className="font-semibold text-sm">{req.profiles?.username || 'Unknown User'}</p>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-wider">{new Date(req.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleReject(req.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Reject"
                    >
                      <X size={18} />
                    </button>
                    <button 
                      onClick={() => handleApprove(req.id)}
                      className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors border border-green-100 dark:border-green-900/30"
                      title="Approve"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-neutral-50 dark:bg-neutral-800/30 border-t dark:border-neutral-800">
          <button 
            onClick={onClose}
            className="w-full py-2.5 font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
