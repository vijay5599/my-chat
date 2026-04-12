'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Message, Profile, MessageReaction } from '@/types'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Avatar } from './Avatar'
import { Mic, Trash2, Eye, EyeOff, X, AlertTriangle, Reply, Smile, PlusCircle, Pencil, Check } from 'lucide-react'
import EmojiPicker from './EmojiPicker'
import { CelebrationMode } from '@/lib/hooks/usePresence'
import TicTacToeMultiplayer from './TicTacToeMultiplayer'
import { GAME_PREFIX, TicTacToeState, handleMove as handleGameMove, createInitialGameState } from '@/lib/games'

const isEmojiOnly = (str: string) => {
  // Simple check for single emoji (including multi-char ones like family)
  const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
  const matches = str.match(emojiRegex);
  return matches && matches.length === 1 && str.trim() === matches[0];
};

export default function MessageList({
  messages,
  currentUserId,
  onDeleteMessage,
  onUpdateMessage,
  onReply,
  onToggleReaction,
  onEditMessage,
  members,
  onlineUsers
}: {
  messages: Message[],
  currentUserId: string,
  onDeleteMessage: (id: string, audioUrl?: string) => void,
  onUpdateMessage: (id: string, updates: Partial<Message>) => void,
  onReply: (message: Message) => void,
  onToggleReaction: (messageId: string, emoji: string) => void,
  onEditMessage?: (id: string, content: string) => Promise<{ success?: boolean, error?: string }>,
  members: Profile[],
  onlineUsers: string[]
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [viewingMessage, setViewingMessage] = useState<Message | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null) // messageId
  const [showFullPicker, setShowFullPicker] = useState<string | null>(null) // messageId
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const isInitialRender = useRef(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({
        behavior: isInitialRender.current ? 'auto' : 'smooth'
      })
    }
  }, [messages])

  // Stability Fix: Handle dynamic height changes (images/avatars loading)
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isInitialRender.current) {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' })
        // Once we've handled the dynamic height after initial messages, mark it done
        if (messages.length > 0) {
          isInitialRender.current = false
        }
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [messages.length]);

  // Handle click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showEmojiPicker && !target.closest('.emoji-picker-container')) {
        setShowEmojiPicker(null)
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


  const renderMessageContent = (content: string, isMe: boolean, messageId: string) => {
    if (!content) return null

    const isMediaUrl = (url: string) => {
      return url.startsWith('blob:') ||
        url.startsWith('data:image/') || // Hugging Face / Base64
        url.match(/\.(gif|jpe?g|png|webp|svg)(\?.*)?$/i) ||
        url.includes('supabase.co/storage/v1/object/public/') ||
        url.includes('oaidalleapiprodscus.blob.core.windows.net') ||
        url.includes('image.pollinations.ai') ||
        url.includes('giphy.com/media/') ||
        url.includes('media.giphy.com/') ||
        url.includes('tenor.com/view/') ||
        url.includes('media.tenor.com/');
    }

    if (isMediaUrl(content)) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSelectedImage(content)}
          className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black/20 max-w-[240px] sm:max-w-[280px] group relative cursor-zoom-in"
        >
          <img
            src={content}
            alt="Media"
            className="w-full h-auto block opacity-90 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white translate-y-4 group-hover:translate-y-0 transition-all">
              <Smile size={16} />
            </div>
          </div>
        </motion.div>
      )
    }

    if (isEmojiOnly(content)) {
      return (
        <motion.div
          initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
          animate={{ scale: 1.1, rotate: 0, opacity: 1 }}
          whileHover={{ scale: 1.3, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="text-5xl py-2 select-none cursor-default living-emoji"
        >
          {content}
        </motion.div>
      )
    }

    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;

    const formatRichText = (text: string) => {
      // 1. Handle Mentions (@username)
      const mentionRegex = /@(\w+)/g

      // 2. Simple Markdown regex components
      let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        // Bold
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // List items
        .replace(/^\d+\.\s+(.*?)$/gm, '<li class="ml-4 list-decimal">$1</li>')
        .replace(/^[-*]\s+(.*?)$/gm, '<li class="ml-4 list-disc">$1</li>')
        // Line breaks
        .replace(/\n/g, '<br />');

      // 3. Process emojis and mentions into React elements
      // First, we split by emojis to wrap them in 'living-emoji' class
      const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;

      const processSegment = (segment: string) => {
        const parts = segment.split(mentionRegex);
        return parts.map((part, i) => {
          if (i % 2 === 1) {
            const isMember = members.some(m => m.username === part)
            return (
              <span
                key={i}
                className={clsx(
                  "font-bold px-1.5 py-0.5 rounded-md mx-0.5",
                  isMember ? "text-blue-400 bg-blue-500/10" : "text-neutral-500"
                )}
              >
                @{part}
              </span>
            );
          }

          // Split by emojis for living emoji support
          const subParts = part.split(emojiRegex);
          return subParts.map((subPart, subIdx) =>
            emojiRegex.test(subPart)
              ? <span key={subIdx} className="living-emoji inline-block align-middle mx-0.5">{subPart}</span>
              : <span key={subIdx} dangerouslySetInnerHTML={{ __html: subPart }} />
          );
        });
      };

      return <div className="markdown-body">{processSegment(html)}</div>;
    };

    if (editingId === messageId) {
      return (
        <div className="flex flex-col gap-2 min-w-[200px]">
          <textarea
            autoFocus
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full bg-white/10 dark:bg-black/20 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 ring-blue-500/50 resize-none min-h-[60px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSaveEdit(messageId)
              }
              if (e.key === 'Escape') setEditingId(null)
            }}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditingId(null)}
              className="px-2 py-1 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveEdit(messageId)}
              disabled={isUpdating}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs font-bold hover:bg-blue-500 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              {isUpdating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={12} />}
              Save
            </button>
          </div>
        </div>
      )
    }

    if (content.startsWith(GAME_PREFIX)) {
      try {
        const gameState = JSON.parse(content.replace(GAME_PREFIX, '')) as TicTacToeState
        const myPlayer = gameState.players.X.id === currentUserId ? 'X' : (gameState.players.O.id === currentUserId ? 'O' : null)
        const isMyTurn = (gameState.isXNext && myPlayer === 'X') || (!gameState.isXNext && myPlayer === 'O')

        return (
          <TicTacToeMultiplayer
            {...gameState}
            isMe={isMe}
            isMyTurn={isMyTurn}
            myPlayer={myPlayer}
            onMove={(index) => {
              const newState = handleGameMove(gameState, index, currentUserId)
              if (newState) {
                onUpdateMessage(messageId, { content: GAME_PREFIX + JSON.stringify(newState) })
              }
            }}
            onReset={() => {
              const newState = createInitialGameState(gameState.players.X, gameState.players.O)
              onUpdateMessage(messageId, { content: GAME_PREFIX + JSON.stringify(newState) })
            }}
          />
        )
      } catch (e) {
        return <div className="text-xs text-rose-500 italic">Failed to load game data</div>
      }
    }

    return (
      <div className="break-words leading-relaxed text-sm">
        {formatRichText(content)}
      </div>
    )
  }

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim() || !onEditMessage) return
    setIsUpdating(true)
    try {
      const result = await onEditMessage(id, editContent)
      if (result.success) {
        onUpdateMessage(id, { content: editContent, is_edited: true })
        setEditingId(null)
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-w-[300px] overflow-y-auto px-2 py-3 space-y-1.5 relative text-neutral-800 dark:text-neutral-200"
    >
      {messages.length === 0 ? (
        <div className="text-center text-neutral-500 mt-10">
          No messages yet. Be the first to say hi!
        </div>
      ) : (
          messages.map((msg) => {
            const isMe = msg.user_id === currentUserId
            const isViewOnce = msg.is_view_once
            const isViewed = msg.is_viewed
            const isGame = msg.content?.startsWith(GAME_PREFIX)

          return (
            <div
              key={msg.id}
              className={clsx('flex w-full gap-2 group px-1 relative', isMe ? 'flex-row-reverse' : 'flex-row')}
            >
              <Avatar
                url={msg.profiles?.avatar_url}
                name={msg.profiles?.username || 'User'}
                size="sm"
                isOnline={onlineUsers.includes(msg.user_id)}
              />
              <div
                className={clsx('flex flex-col min-w-0 w-full max-w-[80%] sm:max-w-[85%] md:max-w-[73%] lg:max-w-[67%]', isMe ? 'items-end' : 'items-start')}
              >
                <div className={clsx('flex items-center gap-2 flex-wrap', isMe ? 'flex-row-reverse' : 'flex-row')}>
                  <div
                    className={clsx(
                      'text-sm relative transition-all duration-200 min-w-0 flex-shrink message-content',
                      isGame 
                        ? 'p-0 bg-transparent border-none shadow-none overflow-visible w-full'
                        : clsx(
                            'rounded-2xl px-3 py-1.5 shadow-sm break-words whitespace-pre-wrap overflow-hidden',
                            isMe
                              ? (isViewOnce
                                ? (isViewed ? 'bg-neutral-100 dark:bg-neutral-900 text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-tr-none' : 'bg-amber-600 text-white rounded-tr-none ring-2 ring-amber-400/30')
                                : 'bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-500/20')
                              : (isViewOnce
                                ? (isViewed
                                  ? 'bg-neutral-50 dark:bg-neutral-900/50 text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-tl-none italic'
                                  : 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400/50 text-amber-900 dark:text-amber-100 rounded-tl-none cursor-pointer hover:scale-[1.02] active:scale-[0.98]')
                                : 'bg-white dark:bg-neutral-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700 backdrop-blur-sm')
                          )
                    )}
                    onClick={() => !isGame && isViewOnce && !isMe && !isViewed && setViewingMessage(msg)}
                  >
                    {/* Replied Message Preview */}
                    {msg.replied_message && (
                      <div className={clsx(
                        "mb-2 p-2 rounded-lg border-l-4 text-[11px] w-full bg-opacity-30 border-opacity-50 overflow-hidden flex flex-col",
                        isMe
                          ? "bg-blue-300/20 border-blue-200 text-blue-100"
                          : "bg-neutral-400/20 border-neutral-400 text-neutral-500 dark:text-neutral-400"
                      )}>
                        <p className="font-bold opacity-80 mb-0.5 truncate w-full">
                          {msg.replied_message.profiles?.username || 'User'}
                        </p>
                        <p className="line-clamp-2 leading-relaxed break-words w-full">
                          {msg.replied_message.content ? (
                            (() => {
                              const url = msg.replied_message.content;
                              const isImage = url.startsWith('blob:') || url.match(/\.(jpe?g|png|webp|svg|gif)(\?.*)?$/i) || url.includes('supabase.co/storage/v1/object/public/');
                              const isGif = url.includes('giphy.com') || url.includes('tenor.com');
                              return isGif ? "🎬 GIF" : (isImage ? "📷 Photo" : url);
                            })()
                          ) : (msg.replied_message.audio_url ? '🎤 Voice Message' : 'Deleted Message')}
                        </p>
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
                          <span>Message viewed and redacted</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-1">
                          <Eye size={16} className="text-amber-600 dark:text-amber-400" />
                          <span className="font-semibold italic">Tap to view secret message</span>
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
                            isMe ? 'bg-blue-500/30' : 'bg-neutral-100 dark:bg-neutral-700'
                          )}>
                            <div className="flex items-center gap-2">
                              <div className={clsx(
                                'p-2 rounded-full',
                                isMe ? 'bg-blue-400/30' : 'bg-neutral-200 dark:bg-neutral-600'
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
                              className="w-[200px] sm:w-[280px] md:w-[320px] max-w-full outline-none"
                            />
                          </div>
                        )}
                        {msg.content && renderMessageContent(msg.content, isMe, msg.id)}
                      </>
                    )}

                    {/* Reactions Display */}
                    {(msg.reactions && msg.reactions.length > 0) && (
                      <div className={clsx(
                        "mt-2 flex flex-wrap gap-1.5",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        <AnimatePresence>
                          {Object.entries(
                            msg.reactions.reduce((acc, r) => {
                              acc[r.emoji] = acc[r.emoji] || []
                              acc[r.emoji].push(r)
                              return acc
                            }, {} as Record<string, MessageReaction[]>)
                          ).map(([emoji, reactions]) => {
                            const hasReacted = reactions.some(r => r.user_id === currentUserId)
                            return (
                              <motion.button
                                key={emoji}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onToggleReaction(msg.id, emoji)
                                }}
                                className={clsx(
                                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all border shadow-sm",
                                  hasReacted
                                    ? "bg-blue-100 dark:bg-blue-600/30 border-blue-300 dark:border-blue-500 text-blue-800 dark:text-blue-100"
                                    : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                )}
                                title={reactions.map(r => r.profiles?.username).join(', ')}
                              >
                                <span className={clsx("text-sm", hasReacted && "living-emoji")}>{emoji}</span>
                                <span className="font-extrabold text-[10px] tabular-nums">{reactions.length}</span>
                              </motion.button>
                            )
                          })}
                        </AnimatePresence>
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
                      {msg.is_edited && (
                        <span className="text-[10px] italic opacity-60 text-green-100">Edited</span>
                      )}
                      {isViewOnce && <EyeOff size={10} />}
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </div>
                  </div>

                  {/* Actions (Reply / React / Delete) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onReply(msg)
                      }}
                      className="p-1.5 text-blue-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-neutral-900 shadow-sm hover:scale-110 active:scale-95"
                      title="Reply"
                    >
                      <Reply size={15} className={isMe ? "" : "scale-x-[-1]"} />
                    </button>
                    <div className="relative emoji-picker-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)
                        }}
                        className={clsx(
                          "p-1.5 rounded-full transition-all border shadow-sm hover:scale-110 active:scale-95",
                          showEmojiPicker === msg.id
                            ? "text-amber-600 bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-500"
                            : "text-amber-500/70 hover:text-amber-500 border-slate-200 dark:border-slate-700 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        )}
                        title="React"
                      >
                        <Smile size={15} />
                      </button>

                      <AnimatePresence>
                        {showEmojiPicker === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 10 }}
                            className={clsx(
                              "z-[110] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-2.5 py-2 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-200 dark:border-slate-800 flex items-center gap-1",
                              "absolute bottom-full mb-2 whitespace-nowrap left-1/2 -translate-x-1/2 origin-bottom"
                            )}
                          >
                            {['👍', '❤️', '😂', '😮', '😢'].map((emoji, i) => (
                              <motion.button
                                key={emoji}
                                initial={{ opacity: 0, scale: 0.5, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: i * 0.04, type: "spring", damping: 15 }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onToggleReaction(msg.id, emoji)
                                  setShowEmojiPicker(null)
                                }}
                                className="w-9 h-9 flex items-center justify-center text-xl hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-all hover:scale-125 active:scale-95"
                              >
                                {emoji}
                              </motion.button>
                            ))}
                            <motion.button
                              initial={{ opacity: 0, scale: 0.5, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ delay: 5 * 0.04 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowFullPicker(msg.id)
                                setShowEmojiPicker(null)
                              }}
                              className="w-8 h-8 ml-1 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-neutral-100 dark:hover:bg-slate-800 rounded-full transition-all border border-slate-200 dark:border-slate-800 shadow-sm"
                            >
                              <PlusCircle size={14} />
                            </motion.button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <AnimatePresence>
                        {showFullPicker === msg.id && (
                          <EmojiPicker
                            onSelect={(emoji) => {
                              onToggleReaction(msg.id, emoji)
                              setShowFullPicker(null)
                            }}
                            onClose={() => setShowFullPicker(null)}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                    {isMe && !isViewOnce && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingId(msg.id)
                          setEditContent(msg.content)
                        }}
                        className="p-1.5 text-blue-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-neutral-900 shadow-sm hover:scale-110 active:scale-95"
                        title="Edit message"
                      >
                        <Pencil size={15} />
                      </button>
                    )}

                    {isMe && !isViewed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteMessage(msg.id, msg.audio_url)
                        }}
                        className="p-1.5 text-rose-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-all border border-slate-200 dark:border-slate-700 bg-white dark:bg-neutral-900 shadow-sm hover:scale-110 active:scale-95"
                        title="Delete message"
                      >
                        <Trash2 size={15} />
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
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 animate-in zoom-in-95 duration-300">
            <div className="bg-amber-600 px-6 py-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="font-bold text-lg">Secret View-Once Message</h3>
              </div>
              <button
                onClick={handleCloseView}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Close and Redact"
              >
                <X size={28} />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <Avatar
                  url={viewingMessage.profiles?.avatar_url}
                  name={viewingMessage.profiles?.username}
                  size="sm"
                />
                <div>
                  <p className="text-base font-bold dark:text-white">{viewingMessage.profiles?.username}</p>
                  <p className="text-xs text-neutral-500">{format(new Date(viewingMessage.created_at), 'MMM d, h:mm a')}</p>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800 p-8 rounded-2xl mb-8 border dark:border-neutral-700 min-h-[120px] flex flex-col justify-center">
                {viewingMessage.audio_url && (
                  <div className="mb-6">
                    <audio
                      src={viewingMessage.audio_url}
                      controls
                      autoPlay
                      className="w-full outline-none"
                    />
                  </div>
                )}
                {viewingMessage.content && (
                  <div className="text-lg dark:text-neutral-100 whitespace-pre-wrap break-words italic leading-relaxed text-center font-serif">
                    "{viewingMessage.content}"
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3 text-amber-700 dark:text-amber-400 text-xs font-semibold bg-amber-50 dark:bg-amber-900/30 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50">
                <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">IMPORTANT: This message is for your eyes only. It will be permanently redacted from our servers and your device once you click the button below or leave this view.</p>
              </div>

              <button
                onClick={handleCloseView}
                className="w-full mt-10 py-5 bg-neutral-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-sm rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-black/10 dark:shadow-white/10"
              >
                Done, redact it now
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.button
              type="button"
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md border border-white/10 transition-colors z-50"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </motion.button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage}
                alt="Preview"
                className="max-w-full max-h-[90vh] rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.5)] object-contain border border-white/5"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
