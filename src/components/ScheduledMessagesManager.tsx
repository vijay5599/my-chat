'use client'

import { useState, useEffect } from 'react'
import { getScheduledMessages, cancelScheduledMessage } from '@/app/chat/actions'
import { ScheduledMessage } from '@/types'
import { Clock, Trash2, X, Calendar, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function ScheduledMessagesManager({ 
  roomId, 
  onClose 
}: { 
  roomId: string, 
  onClose: () => void 
}) {
  const [messages, setMessages] = useState<ScheduledMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = async () => {
    setLoading(true)
    const result = await getScheduledMessages(roomId)
    if (result.data) {
      setMessages(result.data as ScheduledMessage[])
    } else if (result.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMessages()
  }, [roomId])

  const handleCancel = async (id: string) => {
    const result = await cancelScheduledMessage(id)
    if (result.success) {
      setMessages(prev => prev.filter(m => m.id !== id))
    } else if (result.error) {
      alert(`Failed to cancel: ${result.error}`)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border dark:border-neutral-800 animate-in zoom-in-95 duration-300">
        <div className="bg-purple-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Clock size={20} />
            <h3 className="font-bold">Scheduled Messages</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
              <AlertCircle size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-400">
                <Clock size={32} />
              </div>
              <p className="text-sm text-neutral-500">No scheduled messages in this room.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-4 border dark:border-neutral-700/50 group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                      <Calendar size={14} />
                      <span className="text-xs font-bold leading-none">
                        {format(new Date(msg.scheduled_for), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleCancel(msg.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 break-words italic">
                    "{msg.content}"
                  </p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
