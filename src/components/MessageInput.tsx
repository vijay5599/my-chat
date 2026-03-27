'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic } from 'lucide-react'
import VoiceRecorder from './VoiceRecorder'

export default function MessageInput({ 
  onSendMessage, 
  onTyping 
}: { 
  onSendMessage: (content: string, audioBlob?: Blob) => void,
  onTyping: (isTyping: boolean) => void
}) {
  const [content, setContent] = useState('')
  const [isVoiceRecording, setIsVoiceRecording] = useState(false)
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

    onSendMessage(content)
    setContent('')
    onTyping(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
  }

  const handleAudioReady = (blob: Blob) => {
    onSendMessage('', blob)
    setIsVoiceRecording(false)
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
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setIsVoiceRecording(true)}
            className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-full transition-colors"
            title="Voice Message"
          >
            <Mic size={20} />
          </button>
          
          <input
            type="text"
            value={content}
            onChange={handleChange}
            placeholder="Type a message..."
            className="flex-1 rounded-full px-4 py-2 border dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
          />
          <button 
            type="submit" 
            disabled={!content.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Send
          </button>
        </form>
      )}
    </div>
  )
}
