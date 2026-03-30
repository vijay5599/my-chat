'use client'

import { useEffect, useRef, useState } from 'react'
import { Message } from '@/types'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Avatar } from './Avatar'
import { Mic, Trash2, Eye, EyeOff, X, AlertTriangle } from 'lucide-react'

export default function MessageList({ 
  messages, 
  currentUserId,
  onDeleteMessage,
  onUpdateMessage
}: { 
  messages: Message[], 
  currentUserId: string,
  onDeleteMessage: (id: string, audioUrl?: string) => void,
  onUpdateMessage: (id: string, updates: Partial<Message>) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [viewingMessage, setViewingMessage] = useState<Message | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleCloseView = () => {
    if (viewingMessage && viewingMessage.user_id !== currentUserId) {
      // Mark as viewed and clear content for privacy
      onUpdateMessage(viewingMessage.id, { 
        is_viewed: true, 
        content: '', 
        audio_url: undefined 
      })
    }
    setViewingMessage(null)
  }

  return (
    <div className="flex-1 min-w-[300px] overflow-y-auto p-6 space-y-4 relative">
      {messages.length === 0 ? (
        <div className="text-center text-neutral-500 mt-10">
          No messages yet. Be the first to say hi!
        </div>
      ) : (
        messages.map((msg) => {
          const isMe = msg.user_id === currentUserId
          const isViewOnce = msg.is_view_once
          const isViewed = msg.is_viewed
          
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
                className={clsx('flex flex-col min-w-0', isMe ? 'items-end' : 'items-start')}
              >
                <div
                  className={clsx(
                    'max-w-[85%] min-w-[100px] rounded-2xl px-4 py-2 text-sm relative transition-all duration-200',
                    isMe
                      ? (isViewOnce 
                          ? (isViewed ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-tr-none' : 'bg-amber-600 text-white rounded-tr-none ring-2 ring-amber-400/30') 
                          : 'bg-blue-600 text-white rounded-tr-none')
                      : (isViewOnce 
                          ? (isViewed 
                              ? 'bg-neutral-50 dark:bg-neutral-900/50 text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-tl-none italic' 
                              : 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400/50 text-amber-900 dark:text-amber-100 rounded-tl-none cursor-pointer hover:scale-[1.02] active:scale-[0.98]') 
                          : 'bg-neutral-200 dark:bg-neutral-800 text-foreground rounded-tl-none')
                  )}
                  onClick={() => isViewOnce && !isMe && !isViewed && setViewingMessage(msg)}
                >
                  {isMe && !isViewed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteMessage(msg.id, msg.audio_url)
                      }}
                      className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete message"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {!isMe && (
                    <p className={clsx(
                      "text-[10px] font-bold mb-1 uppercase tracking-tight",
                      isViewOnce 
                        ? (isViewed ? "text-neutral-400" : "text-amber-600 dark:text-amber-400") 
                        : "text-blue-600 dark:text-blue-400"
                    )}>
                      {msg.profiles?.username || 'User'}
                    </p>
                  )}

                  {isViewOnce && !isMe ? (
                    isViewed ? (
                      <div className="flex items-center gap-2 py-1 opacity-60">
                        <EyeOff size={14} className="text-neutral-400" />
                        <span>this is once view message</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-1">
                        <Eye size={16} className="text-amber-600 dark:text-amber-400" />
                        <span className="font-semibold italic">View-Once Message</span>
                      </div>
                    )
                  ) : isViewOnce && isMe && isViewed ? (
                    <div className="flex items-center gap-2 py-1 opacity-60">
                      <EyeOff size={14} className="text-neutral-400" />
                      <span>Message viewed</span>
                    </div>
                  ) : (
                    <>
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
                      {msg.content && <p className="break-all leading-relaxed">{msg.content}</p>}
                    </>
                  )}

                  <div
                    className={clsx(
                      'text-[9px] mt-1.5 opacity-70 text-right font-medium flex items-center justify-end gap-1',
                      isMe 
                        ? (isViewed ? 'text-neutral-400' : 'text-blue-100') 
                        : (isViewOnce ? (isViewed ? 'text-neutral-400' : 'text-amber-700 dark:text-amber-300') : 'text-neutral-500')
                    )}
                  >
                    {isViewOnce && <EyeOff size={10} />}
                    {format(new Date(msg.created_at), 'h:mm a')}
                  </div>
                </div>
                {isViewOnce && isMe && !isViewed && (
                  <p className="text-[9px] text-amber-600 mt-1 font-medium italic">Sent as View-Once</p>
                )}
              </div>
            </div>
          )
        })
      )}
      <div ref={bottomRef} />

      {/* View Once Overlay */}
      {viewingMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 animate-in zoom-in-95 duration-300">
            <div className="bg-amber-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} />
                <h3 className="font-bold">Secret Message</h3>
              </div>
              <button 
                onClick={handleCloseView}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title="Close"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Avatar 
                  url={viewingMessage.profiles?.avatar_url} 
                  name={viewingMessage.profiles?.username} 
                  size="sm" 
                />
                <div>
                  <p className="text-sm font-bold">{viewingMessage.profiles?.username}</p>
                  <p className="text-[10px] text-neutral-500">{format(new Date(viewingMessage.created_at), 'MMM d, h:mm a')}</p>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-6 mb-6">
                {viewingMessage.audio_url && (
                  <div className="mb-4">
                    <audio
                      src={viewingMessage.audio_url}
                      controls
                      autoPlay
                      className="w-full outline-none"
                    />
                  </div>
                )}
                {viewingMessage.content && (
                  <p className="text-lg leading-relaxed dark:text-neutral-100 break-words">
                    {viewingMessage.content}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/30">
                <AlertTriangle size={16} />
                <p>This message will be redacted permanently after you close this view.</p>
              </div>

              <button
                onClick={handleCloseView}
                className="w-full mt-8 py-3 bg-neutral-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                I understand, close it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
