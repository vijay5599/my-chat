'use client'

import { useEffect, useRef, useState } from 'react'
import { Message, Profile, MessageReaction } from '@/types'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Avatar } from './Avatar'
import { Mic, Trash2, Eye, EyeOff, X, AlertTriangle, Reply, Smile } from 'lucide-react'
import EmojiPicker from './EmojiPicker'

export default function MessageList({
  messages,
  currentUserId,
  onDeleteMessage,
  onUpdateMessage,
  onReply,
  onToggleReaction,
  members,
  onlineUsers
}: {
  messages: Message[],
  currentUserId: string,
  onDeleteMessage: (id: string, audioUrl?: string) => void,
  onUpdateMessage: (id: string, updates: Partial<Message>) => void,
  onReply: (message: Message) => void,
  onToggleReaction: (messageId: string, emoji: string) => void,
  members: Profile[],
  onlineUsers: string[]
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [viewingMessage, setViewingMessage] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null) // messageId

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Handle click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showEmojiPicker) {
        const target = event.target as HTMLElement
        // Check if click is outside the picker and the trigger button
        if (!target.closest('.emoji-picker-container')) {
          setShowEmojiPicker(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

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


  const renderMessageContent = (content: string) => {
    if (!content) return null

    // Regex to match @username (stopping at space or end of string)
    const mentionRegex = /@(\w+)/g
    const parts = content.split(mentionRegex)

    if (parts.length === 1) return <p className="break-words leading-relaxed text-sm">{content}</p>

    return (
      <p className="break-words leading-relaxed text-sm">
        {parts.map((part, i) => {
          // Every odd part is a captured username from the regex
          if (i % 2 === 1) {
            const isMember = members.some(m => m.username === part)
            return (
              <span
                key={i}
                className={clsx(
                  "font-bold px-1 rounded-sm",
                  isMember
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-800/50"
                    : "text-neutral-500"
                )}
              >
                @{part}
              </span>
            )
          }
          return part
        })}
      </p>
    )
  }

  return (
    <div className="flex-1 min-w-[300px] overflow-y-auto p-1 space-y-4 relative">
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
              className={clsx('flex w-full gap-3 group px-2 relative', isMe ? 'flex-row-reverse' : 'flex-row')}
            >
              <Avatar
                url={msg.profiles?.avatar_url}
                name={msg.profiles?.username || 'User'}
                size="sm"
                isOnline={onlineUsers.includes(msg.user_id)}
              />
              <div
                className={clsx('flex flex-col min-w-0 w-full max-w-[85%] md:max-w-[73%] lg:max-w-[67%]', isMe ? 'items-end' : 'items-start')}
              >
                <div className={clsx('flex items-center gap-2', isMe ? 'flex-row-reverse' : 'flex-row')}>
                  <div
                    className={clsx(
                      'rounded-2xl px-4 py-2 text-sm relative transition-all duration-200 shadow-sm break-words whitespace-pre-wrap overflow-hidden',
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
                    {/* Replied Message Preview */}
                    {msg.replied_message && (
                      <div className={clsx(
                        "mb-2 p-2 rounded-lg border-l-4 text-[11px] line-clamp-2 max-w-full truncate",
                        isMe
                          ? "bg-blue-700/30 border-blue-400 text-blue-100"
                          : "bg-neutral-300/50 dark:bg-neutral-700/50 border-neutral-400 text-neutral-500"
                      )}>
                        <p className="font-bold opacity-80 mb-0.5">
                          {msg.replied_message.profiles?.username || 'User'}
                        </p>
                        {msg.replied_message.content || (msg.replied_message.audio_url ? 'Voice Message' : 'Deleted Message')}
                      </div>
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
                        {msg.content && renderMessageContent(msg.content)}
                      </>
                    )}

                    {/* Reactions Display */}
                    {(msg.reactions && msg.reactions.length > 0) && (
                      <div className={clsx(
                        "mt-2 flex flex-wrap gap-1.5",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        {Object.entries(
                          msg.reactions.reduce((acc, r) => {
                            acc[r.emoji] = acc[r.emoji] || []
                            acc[r.emoji].push(r)
                            return acc
                          }, {} as Record<string, MessageReaction[]>)
                        ).map(([emoji, reactions]) => {
                          const hasReacted = reactions.some(r => r.user_id === currentUserId)
                          return (
                            <button
                              key={emoji}
                              onClick={(e) => {
                                e.stopPropagation()
                                onToggleReaction(msg.id, emoji)
                              }}
                              className={clsx(
                                "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all border",
                                hasReacted
                                  ? "bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-sm"
                                  : "bg-white/50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                              )}
                              title={reactions.map(r => r.profiles?.username).join(', ')}
                            >
                              <span>{emoji}</span>
                              <span className="font-bold text-[10px]">{reactions.length}</span>
                            </button>
                          )
                        })}
                      </div>
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

                  {/* Actions (Reply / Delete) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onReply(msg)
                      }}
                      className="p-2 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-all active:scale-125 shadow-sm bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border dark:border-neutral-700"
                      title="Reply"
                    >
                      <Reply size={16} className={isMe ? "" : "scale-x-[-1]"} />
                    </button>
                    <div className="relative emoji-picker-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)
                        }}
                        className={clsx(
                          "p-2 rounded-full transition-all active:scale-125 shadow-sm bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border dark:border-neutral-700",
                          showEmojiPicker === msg.id
                            ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200"
                            : "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                        )}
                        title="React"
                      >
                        <Smile size={16} />
                      </button>

                      {showEmojiPicker === msg.id && (
                        <EmojiPicker
                          className={clsx("z-[110]", isMe ? "right-0" : "left-0")}
                          onSelect={(emoji) => {
                            onToggleReaction(msg.id, emoji)
                            setShowEmojiPicker(null)
                          }}
                          onClose={() => setShowEmojiPicker(null)}
                        />
                      )}
                    </div>

                    {isMe && !isViewed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteMessage(msg.id, msg.audio_url)
                        }}
                        className="p-2 text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-full transition-all active:scale-125 shadow-sm bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm border dark:border-neutral-700"
                        title="Delete message"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
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
                {viewingMessage.content && renderMessageContent(viewingMessage.content)}
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
