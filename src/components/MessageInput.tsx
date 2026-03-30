'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Eye, EyeOff } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'
import clsx from 'clsx'

export default function MessageInput({ 
  onSendMessage, 
  onTyping 
}: { 
  onSendMessage: (content: string, audioBlob?: Blob, isViewOnce?: boolean) => void,
  onTyping: (isTyping: boolean) => void
}) {
  const [content, setContent] = useState('')
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
  const [isViewOnce, setIsViewOnce] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value)

    onTyping(true)
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false)
    }, 2000)
  }

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
    <div className="p-4 border-t dark:border-neutral-800 bg-white dark:bg-black">
      {isVoiceRecording ? (
        <div className="flex justify-center">
          <VoiceRecorder onAudioReady={handleAudioReady} onCancel={handleVoiceCancel} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <form onSubmit={handleSubmit} className="flex gap-2 items-center">
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
                "px-4 py-2 rounded-full text-sm font-medium disabled:opacity-50 transition-colors shadow-sm",
                isViewOnce ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              Send
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
