'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/types'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Avatar } from './Avatar'
import { Mic, Trash2 } from 'lucide-react'

export default function MessageList({ 
  messages, 
  currentUserId,
  onDeleteMessage
}: { 
  messages: Message[], 
  currentUserId: string,
  onDeleteMessage: (id: string, audioUrl?: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-neutral-500 mt-10">
          No messages yet. Be the first to say hi!
        </div>
      ) : (
        messages.map((msg) => {
          const isMe = msg.user_id === currentUserId
          return (
            <div
              key={msg.id}
              className={clsx('flex gap-3 group', isMe ? 'flex-row-reverse' : 'flex-row')}
            >
              <Avatar
                url={msg.profiles?.avatar_url}
                name={msg.profiles?.username || 'User'}
                size="sm"
              />
              <div
                className={clsx('flex flex-col', isMe ? 'items-end' : 'items-start')}
              >
                <div
                  className={clsx(
                    'max-w-[85%] rounded-2xl px-4 py-2 text-sm relative',
                    isMe
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-foreground rounded-tl-none'
                  )}
                >
                  {isMe && (
                    <button
                      onClick={() => onDeleteMessage(msg.id, msg.audio_url)}
                      className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete message"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {!isMe && (
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-tight">
                      {msg.profiles?.username || 'User'}
                    </p>
                  )}
                  {msg.audio_url && (
                    <div className={clsx(
                      'mb-2 rounded-xl p-3 flex flex-col gap-2',
                      isMe ? 'bg-blue-500/30' : 'bg-neutral-300 dark:bg-neutral-700'
                    )}>
                      <div className="flex items-center gap-2">
                        <div className={clsx(
                          'p-2 rounded-full',
                          isMe ? 'bg-blue-400/30' : 'bg-neutral-400/30'
                        )}>
                          <Mic size={16} className={isMe ? 'text-blue-100' : 'text-neutral-600 dark:text-neutral-300'} />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                          Voice Message
                        </span>
                      </div>
                      <audio
                        src={msg.audio_url}
                        controls
                        className="w-[280px] sm:w-[320px] max-w-full outline-none"
                      />
                    </div>
                  )}
                  {msg.content && <p className="break-words leading-relaxed">{msg.content}</p>}
                  <div
                    className={clsx(
                      'text-[9px] mt-1.5 opacity-70 text-right font-medium',
                      isMe ? 'text-blue-100' : 'text-neutral-500'
                    )}
                  >
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </div>
                </div>
              </div>
            </div>
          )
        })
      )}
      <div ref={bottomRef} />
    </div>
  )
}
