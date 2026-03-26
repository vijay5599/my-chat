'use client'

import { useEffect, useRef } from 'react'
import { Message } from '@/types'
import { format } from 'date-fns'
import clsx from 'clsx'

export default function MessageList({ messages, currentUserId }: { messages: Message[], currentUserId: string }) {
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
              className={clsx('flex flex-col', isMe ? 'items-end' : 'items-start')}
            >
              <div 
                className={clsx(
                  'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                  isMe 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-neutral-200 dark:bg-neutral-800 text-foreground rounded-bl-sm'
                )}
              >
                {!isMe && (
                  <p className="text-[10px] font-medium text-neutral-500 mb-1">
                    User: {msg.user_id.slice(0, 5)}...
                  </p>
                )}
                <p>{msg.content}</p>
                <div 
                  className={clsx(
                    'text-[10px] mt-1 text-right',
                    isMe ? 'text-blue-200' : 'text-neutral-400'
                  )}
                >
                  {format(new Date(msg.created_at), 'h:mm a')}
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
