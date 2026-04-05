'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Eye, EyeOff, Smile, Send, X, Clock, Plus, PartyPopper, Sparkles, Snowflake, Radiation, Zap, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import EmojiPicker from './EmojiPicker'
import GifPicker from './GifPicker'
import { Profile, Message } from '@/types'
import { Avatar } from './Avatar'
import VoiceRecorder from './VoiceRecorder'
import ScheduleMessageModal from './ScheduleMessageModal'
import { Image as ImageIcon } from 'lucide-react'
import clsx from 'clsx'
import { CelebrationMode } from '@/lib/hooks/usePresence'

export default function MessageInput({
  onSendMessage,
  onScheduleMessage,
  onTyping,
  onCelebrate,
  members,
  currentUserId,
  replyingTo,
  onCancelReply
}: {
  onSendMessage: (content: string, audioBlob?: Blob, isViewOnce?: boolean) => void,
  onScheduleMessage: (content: string, scheduledFor: string) => void,
  onTyping: (isTyping: boolean) => void,
  onCelebrate: (mode: CelebrationMode, text?: string) => void,
  members: Profile[],
  currentUserId: string,
  replyingTo?: Message | null,
  onCancelReply?: () => void
}) {
  const [content, setContent] = useState('')
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [isViewOnce, setIsViewOnce] = useState(false)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [mentionSearch, setMentionSearch] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false)
  const [showCelebrationMenu, setShowCelebrationMenu] = useState(false)
  const [celebrationText, setCelebrationText] = useState('')
  const [celebrationMode, setCelebrationMode] = useState<CelebrationMode>('rainbow')
  const [showMoreActions, setShowMoreActions] = useState(false)

  const handleSelectGif = (url: string) => {
    onSendMessage(url)
    setIsGifPickerOpen(false)
  }
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const gifPickerRef = useRef<HTMLDivElement>(null)
  const celebrationMenuRef = useRef<HTMLDivElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const pos = e.target.selectionStart || 0
    setContent(value)
    setCursorPosition(pos)

    onTyping(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false)
    }, 2000)

    // Mention detection logic
    const lastAtSymbol = value.lastIndexOf('@', pos - 1)
    if (lastAtSymbol !== -1) {
      const textAfterAt = value.slice(lastAtSymbol + 1, pos)
      if (textAfterAt.includes(' ') || textAfterAt.length > 20) {
        setMentionSearch(null)
      } else {
        setMentionSearch(textAfterAt)
      }
    } else {
      setMentionSearch(null)
    }
  }

  const handleSelectMention = (username: string) => {
    if (mentionSearch === null) return
    const lastAtSymbol = content.lastIndexOf('@', cursorPosition - 1)
    if (lastAtSymbol === -1) return

    const beforeAt = content.slice(0, lastAtSymbol)
    const afterMention = content.slice(cursorPosition)
    const newContent = `${beforeAt}@${username} ${afterMention}`

    setContent(newContent)
    setMentionSearch(null)

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const newPos = beforeAt.length + username.length + 2
        inputRef.current.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }

  const handleCelebrateSubmit = () => {
    if (onCelebrate) {
      onCelebrate(celebrationMode, celebrationText.trim() || undefined)
      setCelebrationText('')
      setShowCelebrationMenu(false)
    }
  }

  const filteredMembers = mentionSearch !== null
    ? members.filter(m =>
      m.id !== currentUserId &&
      m.username.toLowerCase().includes(mentionSearch.toLowerCase())
    )
    : []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    onSendMessage(content, undefined, isViewOnce)
    setContent('')
    setIsViewOnce(false)
    onTyping(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }

  const handleAudioReady = (blob: Blob) => {
    onSendMessage('', blob, isViewOnce)
    setIsVoiceRecording(false)
    setIsViewOnce(false)
  }

  const handleVoiceCancel = () => {
    setIsVoiceRecording(false)
  }

  useEffect(() => {
    if (replyingTo && inputRef.current) {
      inputRef.current.focus()
    }
  }, [replyingTo])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCelebrationMenu && celebrationMenuRef.current && !celebrationMenuRef.current.contains(event.target as Node)) {
        setShowCelebrationMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [showCelebrationMenu])

  return (
    <div className="p-4 border-t dark:border-neutral-800 bg-white dark:bg-black relative pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {mentionSearch !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-4 right-4 sm:right-auto mb-2 w-[calc(100%-2rem)] max-w-sm max-h-48 overflow-y-auto bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl shadow-xl z-50 animate-in slide-in-from-bottom-2 duration-200">
          <div className="p-2 border-b dark:border-neutral-800 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Mention User
          </div>
          {filteredMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelectMention(member.username)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <Avatar url={member.avatar_url} name={member.username} size="sm" />
              <span className="text-sm font-medium">{member.username}</span>
            </button>
          ))}
        </div>
      )}

      {/* Global Celebration Popup - Repositioned to Leftside */}
      <AnimatePresence>
        {showCelebrationMenu && (
          <div className='absolute bottom-full left-4 mb-4 z-[100]' ref={celebrationMenuRef}>
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9, rotateX: -5 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: 15, scale: 0.9, rotateX: -5 }}
              className="w-[320px] bg-white dark:bg-neutral-900 rounded-[2rem] border-2 border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <PartyPopper size={20} />
                  </div>
                  <h3 className="font-black text-lg tracking-tight">Celebrate!</h3>
                </div>
                <button
                  onClick={() => setShowCelebrationMenu(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-5 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase mb-2 block px-1 tracking-widest">Custom Headline (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. WELL DONE TEAM! 🎉"
                    value={celebrationText}
                    onChange={(e) => setCelebrationText(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border-none rounded-2xl px-5 py-3.5 text-sm focus:ring-4 focus:ring-emerald-500/10 focus:outline-none font-bold placeholder:text-neutral-400"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-neutral-500 uppercase mb-2 block px-1 tracking-widest">Pick a Vibe</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setCelebrationMode('rainbow')}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300",
                        celebrationMode === 'rainbow'
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 ring-4 ring-emerald-500/5 shadow-sm"
                          : "border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      )}
                    >
                      <Radiation size={20} className={celebrationMode === 'rainbow' ? "text-emerald-500" : "text-neutral-400"} />
                      <span className="text-[10px] font-black uppercase">Rainbow</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCelebrationMode('fireworks')}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300",
                        celebrationMode === 'fireworks'
                          ? "bg-blue-500/10 border-blue-500 text-blue-600 ring-4 ring-blue-500/5 shadow-sm"
                          : "border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      )}
                    >
                      <Sparkles size={20} className={celebrationMode === 'fireworks' ? "text-blue-500" : "text-neutral-400"} />
                      <span className="text-[10px] font-black uppercase">F-Works</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCelebrationMode('snow')}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300",
                        celebrationMode === 'snow'
                          ? "bg-sky-500/10 border-sky-500 text-sky-600 ring-4 ring-sky-500/5 shadow-sm"
                          : "border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      )}
                    >
                      <Snowflake size={20} className={celebrationMode === 'snow' ? "text-sky-500" : "text-neutral-400"} />
                      <span className="text-[10px] font-black uppercase">Snow</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCelebrationMode('confetti')}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300",
                        celebrationMode === 'confetti'
                          ? "bg-amber-500/10 border-amber-500 text-amber-600 ring-4 ring-amber-500/5 shadow-sm"
                          : "border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      )}
                    >
                      <PartyPopper size={20} className={celebrationMode === 'confetti' ? "text-amber-500" : "text-neutral-400"} />
                      <span className="text-[10px] font-black uppercase">Confetti</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCelebrationMode('love')}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300",
                        celebrationMode === 'love'
                          ? "bg-rose-500/10 border-rose-500 text-rose-600 ring-4 ring-rose-500/5 shadow-sm"
                          : "border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      )}
                    >
                      <Heart size={20} className={celebrationMode === 'love' ? "text-rose-500" : "text-neutral-400"} />
                      <span className="text-[10px] font-black uppercase">Love</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCelebrationMode('zap')}
                      className={clsx(
                        "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-300",
                        celebrationMode === 'zap'
                          ? "bg-yellow-500/10 border-yellow-500 text-yellow-600 ring-4 ring-yellow-500/5 shadow-sm"
                          : "border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      )}
                    >
                      <Zap size={20} className={celebrationMode === 'zap' ? "text-yellow-500" : "text-neutral-400"} />
                      <span className="text-[10px] font-black uppercase">Zap!</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCelebrateSubmit}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
                >
                  Let's Celebrate! <Zap size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isVoiceRecording ? (
        <div className="flex justify-center">
          <VoiceRecorder onAudioReady={handleAudioReady} onCancel={handleVoiceCancel} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {replyingTo && (
            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl mb-1 animate-in slide-in-from-bottom-2 duration-200 group">
              <div className="w-1 h-8 bg-blue-500 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight">
                  Replying to {replyingTo.profiles?.username}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {replyingTo.content || (replyingTo.audio_url ? "Voice message" : "Original message")}
                </p>
              </div>
              <button
                onClick={onCancelReply}
                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
                title="Cancel reply"
              >
                <X size={16} className="text-neutral-400" />
              </button>
            </div>
          )}

          {isEmojiPickerOpen && (
            <div ref={emojiPickerRef}>
              <EmojiPicker
                onSelect={(emoji) => {
                  const start = inputRef.current?.selectionStart || content.length
                  const end = inputRef.current?.selectionEnd || content.length
                  const newContent = content.substring(0, start) + emoji + content.substring(end)
                  setContent(newContent)
                  setTimeout(() => {
                    inputRef.current?.focus()
                    const newPos = start + emoji.length
                    inputRef.current?.setSelectionRange(newPos, newPos)
                  }, 0)
                }}
                onClose={() => setIsEmojiPickerOpen(false)}
              />
            </div>
          )}
          <form onSubmit={handleSubmit} className="flex gap-2 items-center relative">
            <AnimatePresence>
              {isGifPickerOpen && (
                <div ref={gifPickerRef} className="absolute bottom-full mb-2 z-50">
                  <GifPicker
                    onSelect={handleSelectGif}
                    onClose={() => setIsGifPickerOpen(false)}
                  />
                </div>
              )}
            </AnimatePresence>

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  setIsEmojiPickerOpen(!isEmojiPickerOpen)
                  setIsGifPickerOpen(false)
                }}
                className={clsx(
                  "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 flex-shrink-0",
                  isEmojiPickerOpen
                    ? "bg-blue-500/10 text-blue-500"
                    : "text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                )}
                title="Emojis"
              >
                <Smile size={20} />
              </button>

              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  className={clsx(
                    "w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 flex-shrink-0 sm:hidden",
                    showMoreActions
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-neutral-400"
                  )}
                  title="More actions"
                >
                  <Plus size={20} className={clsx("transition-transform duration-300", showMoreActions && "rotate-45")} />
                </button>

                {/* Extra Actions Sub-bar (Mobile) */}
                <div className={clsx(
                  "absolute bottom-full left-0 mb-3 flex gap-2 p-1.5 bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-2xl shadow-xl transition-all duration-300 sm:hidden z-[60]",
                  showMoreActions ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95 pointer-events-none"
                )}>
                  <button
                    type="button"
                    onClick={() => { setIsVoiceRecording(true); setShowMoreActions(false); }}
                    className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-blue-600 bg-neutral-50 dark:bg-neutral-800 rounded-xl"
                  >
                    <Mic size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsViewOnce(!isViewOnce); setShowMoreActions(false); }}
                    className={clsx(
                      "w-10 h-10 flex items-center justify-center rounded-xl",
                      isViewOnce ? "bg-amber-100 text-amber-600" : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500"
                    )}
                  >
                    {isViewOnce ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsScheduleModalOpen(true); setShowMoreActions(false); }}
                    className={clsx(
                      "w-10 h-10 flex items-center justify-center rounded-xl",
                      isScheduleModalOpen ? "bg-purple-100 text-purple-600" : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500"
                    )}
                  >
                    <Clock size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGifPickerOpen(!isGifPickerOpen);
                      setIsEmojiPickerOpen(false);
                      setShowMoreActions(false);
                    }}
                    className={clsx(
                      "w-10 h-10 flex items-center justify-center rounded-xl",
                      isGifPickerOpen ? "bg-indigo-500/10 text-indigo-400" : "bg-neutral-50 dark:bg-neutral-800 text-neutral-500"
                    )}
                  >
                    <ImageIcon size={18} />
                  </button>
                  {/* Celebration Trigger Tool */}
                  {/* Celebration Trigger Tool */}
                  <CelebrateButton
                    isActive={showCelebrationMenu}
                    onClick={() => setShowCelebrationMenu(!showCelebrationMenu)}
                  />
                </div>

                {/* Desktop View Action Icons */}
                <div className="hidden sm:flex items-center">
                  <button
                    type="button"
                    onClick={() => setIsVoiceRecording(true)}
                    className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full transition-colors"
                    title="Voice Message"
                  >
                    <Mic size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsViewOnce(!isViewOnce)}
                    className={clsx(
                      "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200",
                      isViewOnce
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                        : "text-neutral-500 hover:text-amber-600 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    )}
                    title="View Once"
                  >
                    {isViewOnce ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsGifPickerOpen(!isGifPickerOpen)
                      setIsEmojiPickerOpen(false)
                    }}
                    className={clsx(
                      "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300",
                      isGifPickerOpen
                        ? "bg-indigo-500/10 text-indigo-400"
                        : "text-neutral-400 hover:text-indigo-600 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                    )}
                    title="GIFs"
                  >
                    <ImageIcon size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full transition-colors"
                    title="Schedule Message"
                  >
                    <Clock size={18} />
                  </button>

                  <CelebrateButton
                    isActive={showCelebrationMenu}
                    onClick={() => setShowCelebrationMenu(!showCelebrationMenu)}
                  />
                </div>
              </div>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={handleChange}
              placeholder={isViewOnce ? "Type a secret message..." : "Type a message..."}
              className={clsx(
                "flex-1 min-w-0 h-11 rounded-2xl px-4 border transition-all duration-300 text-sm focus:outline-none relative z-10",
                !isViewOnce
                  ? "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10"
                  : "bg-amber-50 dark:bg-amber-900/10 border-amber-500/30 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 placeholder:text-amber-600/30"
              )}
            />
            <button
              type="submit"
              disabled={!content.trim()}
              className={clsx(
                "w-11 h-11 flex-shrink-0 rounded-2xl text-sm font-medium disabled:opacity-30 transition-all duration-500 active:scale-95 flex items-center justify-center",
                isViewOnce ? "bg-amber-600 text-white" : "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
              )}
              title="Send message"
            >
              <Send size={18} />
            </button>
          </form>
          {isViewOnce && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium px-12 animate-in fade-in slide-in-from-top-1 duration-200">
              This message will be redacted permanently after one view.
            </p>
          )}

          {isScheduleModalOpen && (
            <ScheduleMessageModal
              onClose={() => setIsScheduleModalOpen(false)}
              onSchedule={(msgContent, scheduledFor) => {
                onScheduleMessage(msgContent, scheduledFor)
                setIsScheduleModalOpen(false)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

function CelebrateButton({ isActive, onClick }: { isActive: boolean, onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative">
      <AnimatePresence>
        {isHovered && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none">
            <FloatingEmojis />
          </div>
        )}
      </AnimatePresence>
      
      <motion.button
        type="button"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        whileTap={{ scale: 0.85 }}
        animate={isActive ? {
          boxShadow: [
            "0 0 0px 0px rgba(147, 51, 234, 0)",
            "0 0 20px 4px rgba(147, 51, 234, 0.4)",
            "0 0 0px 0px rgba(147, 51, 234, 0)"
          ]
        } : {}}
        transition={isActive ? {
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          },
          type: "spring",
          stiffness: 400,
          damping: 15
        } : { 
          type: "spring", 
          stiffness: 400, 
          damping: 15 
        }}
        className={clsx(
          "w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl sm:rounded-full transition-colors duration-300 border",
          isActive
            ? "bg-purple-500/10 text-purple-600 border-purple-500/20 shadow-sm"
            : "text-neutral-400 border-transparent hover:text-purple-600 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        )}
        title="Global Celebrate"
      >
        <motion.div
          animate={isActive ? {
            y: [0, -6, 0],
            rotate: [0, -5, 5, 0]
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <PartyPopper size={18} />
        </motion.div>
      </motion.button>
    </div>
  )
}

function FloatingEmojis() {
  const emojis = ['🎉', '✨', '🎆']
  
  return (
    <div className="relative h-20 w-10 flex justify-center items-end overflow-visible">
      {emojis.map((emoji, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0, 1, 1, 0], 
            y: -60 - (Math.random() * 20),
            x: (Math.random() - 0.5) * 30,
            scale: [0.5, 1.2, 1, 0.8],
            rotate: (Math.random() - 0.5) * 45
          }}
          transition={{ 
            duration: 1.5 + (Math.random() * 0.5),
            delay: i * 0.1,
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: Math.random()
          }}
          className="absolute text-sm select-none"
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  )
}

