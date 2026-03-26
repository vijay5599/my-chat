'use client'

import { useState, useRef, useEffect } from 'react'

export default function MessageInput({ 
  onSendMessage, 
  onTyping 
}: { 
  onSendMessage: (msg: string) => void,
  onTyping: (isTyping: boolean) => void
}) {
  const [content, setContent] = useState('')
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

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  return (
    <div className="p-4 border-t dark:border-neutral-800 bg-white dark:bg-black">
      <form onSubmit={handleSubmit} className="flex gap-2">
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
    </div>
  )
}
