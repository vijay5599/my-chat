'use client'

import React, { useRef, useEffect } from 'react'
import Picker, { Theme, EmojiStyle } from 'emoji-picker-react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import clsx from 'clsx'

export default function EmojiPicker({ 
  onSelect, 
  onClose,
  className
}: { 
  onSelect: (emoji: string) => void, 
  onClose: () => void,
  className?: string
}) {
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is on the emoji-picker container directly
      const target = event.target as HTMLElement
      if (pickerRef.current && !pickerRef.current.contains(target) && !target.closest('.emoji-picker-container')) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      ref={pickerRef}
      className={clsx(
        "absolute bottom-full mb-4 z-[100] bg-[#0f1117] border border-white/5 p-2 rounded-[2rem] shadow-2xl overflow-hidden",
        className || "left-0"
      )}
    >
      <div className="flex items-center justify-between mb-2 px-3 pt-2">
        <h3 className="font-serif font-bold text-base text-white/80">Emojis</h3>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full text-white/30 hover:text-white transition-all">
          <X size={16} />
        </button>
      </div>
      
      <div className="rounded-2xl overflow-hidden">
        <Picker 
          onEmojiClick={(emojiData) => {
            onSelect(emojiData.emoji)
          }}
          theme={Theme.DARK}
          emojiStyle={EmojiStyle.APPLE}
          autoFocusSearch={false}
          width={320}
          height={400}
          lazyLoadEmojis={true}
          searchPlaceHolder="Search the void..."
          skinTonesDisabled={false}
          previewConfig={{ showPreview: false }}
          style={{
            '--epr-bg-color': 'transparent',
            '--epr-category-label-bg-color': 'rgba(255, 255, 255, 0.05)',
            '--epr-picker-border-color': 'transparent',
            '--epr-hover-bg-color': 'rgba(255, 255, 255, 0.1)',
            '--epr-focus-bg-color': 'rgba(255, 255, 255, 0.1)',
            '--epr-search-input-bg-color': 'rgba(255, 255, 255, 0.05)',
            '--epr-search-input-border-color': 'transparent',
            '--epr-category-icon-active-color': '#6366f1',
          } as any}
        />
      </div>
    </motion.div>
  )
}
