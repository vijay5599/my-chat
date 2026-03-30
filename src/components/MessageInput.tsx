'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Eye, EyeOff, Smile, Send } from 'lucide-react'
import EmojiPicker from './EmojiPicker'
import { Profile } from '@/types'
import { Avatar } from './Avatar'
import VoiceRecorder from './VoiceRecorder'
import clsx from 'clsx'

export default function MessageInput({ 
  onSendMessage, 
  onTyping,
  members,
  currentUserId
}: { 
  onSendMessage: (content: string, audioBlob?: Blob, isViewOnce?: boolean) => void,
  onTyping: (isTyping: boolean) => void,
  members: Profile[],
  currentUserId: string
}) {
  const [content, setContent] = useState('')
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [isViewOnce, setIsViewOnce] = useState(false)
  const [mentionSearch, setMentionSearch] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

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
      // If there's a space or if it's too far back, cancel mention search
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
    
    // Put focus back and move cursor after the inserted mention
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        const newPos = beforeAt.length + username.length + 2 // +1 for @, +1 for space
        inputRef.current.setSelectionRange(newPos, newPos)
      }
    }, 0)
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
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  return (
    <div className="p-4 border-t dark:border-neutral-800 bg-white dark:bg-black relative">
      {mentionSearch !== null && filteredMembers.length > 0 && (
        <div className="absolute bottom-full left-4 mb-2 w-64 max-h-48 overflow-y-auto bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl shadow-xl z-50 animate-in slide-in-from-bottom-2 duration-200">
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
      {isVoiceRecording ? (
        <div className="flex justify-center">
          <VoiceRecorder onAudioReady={handleAudioReady} onCancel={handleVoiceCancel} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {isEmojiPickerOpen && (
            <div ref={emojiPickerRef}>
              <EmojiPicker 
                onSelect={(emoji) => {
                  const start = inputRef.current?.selectionStart || content.length
                  const end = inputRef.current?.selectionEnd || content.length
                  const newContent = content.substring(0, start) + emoji + content.substring(end)
                  setContent(newContent)
                  
                  // Focus back on input and move cursor
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
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
            <button
                type="button"
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className={clsx(
                "p-2 rounded-full transition-all duration-200",
                isEmojiPickerOpen 
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                    : "text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                )}
                title="Emojis"
            >
                <Smile size={20} />
            </button>

            <button
              type="button"
              onClick={() => setIsVoiceRecording(true)}
              className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full transition-colors"
              title="Voice Message"
            >
              <Mic size={20} />
            </button>
            
            <button
              type="button"
              onClick={() => setIsViewOnce(!isViewOnce)}
              className={clsx(
                "p-2 rounded-full transition-all duration-200",
                isViewOnce 
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-sm" 
                  : "text-neutral-500 hover:text-amber-600 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              )}
              title={isViewOnce ? "View Once Active" : "Set as View Once"}
            >
              {isViewOnce ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            
            <input
              ref={inputRef}
              type="text"
              value={content}
              onChange={handleChange}
              placeholder={isViewOnce ? "Type a secret message..." : "Type a message..."}
              className={clsx(
                "flex-1 rounded-full px-4 py-2 border transition-all duration-200 bg-neutral-100 dark:bg-neutral-900 focus:outline-none focus:ring-1 text-sm",
                isViewOnce 
                  ? "border-amber-400/50 focus:ring-amber-500 placeholder:text-amber-600/50" 
                  : "dark:border-neutral-700 focus:ring-blue-500"
              )}
            />
            <button 
              type="submit" 
              disabled={!content.trim()}
              className={clsx(
                "p-2.5 rounded-full text-sm font-medium disabled:opacity-50 transition-all shadow-sm active:scale-95",
                isViewOnce ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              <Send size={18} />
            </button>
          </form>
          {isViewOnce && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium px-12 animate-in fade-in slide-in-from-top-1 duration-200">
              Message will disappear after one view.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
