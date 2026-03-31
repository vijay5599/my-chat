'use client'

import React, { useEffect, useState } from 'react'
import { X, MessageSquare, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'

interface NotificationToastProps {
  message: string
  senderName: string
  roomName: string
  roomId: string
  onClose: () => void
}

export default function NotificationToast({ 
  message, 
  senderName, 
  roomName, 
  roomId, 
  onClose 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10)
    
    // Auto-close after 5 seconds
    const autoCloseTimer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Wait for exit animation
    }, 5000)

    return () => {
      clearTimeout(timer)
      clearTimeout(autoCloseTimer)
    }
  }, [onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div className={clsx(
      "fixed top-6 right-6 z-[100] w-full max-w-sm transition-all duration-300 ease-out transform",
      isVisible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-12 opacity-0 scale-95"
    )}>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <div className="p-4 flex gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
            <MessageSquare size={24} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">New Message</span>
              <button 
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
              {senderName} <span className="font-normal text-slate-500 dark:text-slate-400">in</span> {roomName}
            </p>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1 mb-3">
              {message}
            </p>
            
            <Link 
              href={`/chat/${roomId}`}
              onClick={handleClose}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline group"
            >
              Go to chat
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-[notify-progress_5s_linear_forwards]" />
        </div>
      </div>

      <style jsx>{`
        @keyframes notify-progress {
          from { width: 100% }
          to { width: 0% }
        }
      `}</style>
    </div>
  )
}
