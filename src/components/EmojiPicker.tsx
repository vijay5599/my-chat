'use client'

import React, { useRef, useEffect } from 'react'
import Picker, { Theme, EmojiStyle } from 'emoji-picker-react'
import { useTheme } from 'next-themes'
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
  const { theme } = useTheme()
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div 
      ref={pickerRef}
      className={clsx(
      "absolute bottom-full mb-4 z-[100] animate-in zoom-in-95 duration-200",
      className || "left-0"
    )}>
      <div className="relative shadow-2xl rounded-2xl overflow-hidden border dark:border-neutral-800">
        <Picker 
          onEmojiClick={(emojiData) => {
            onSelect(emojiData.emoji)
            onClose()
          }}
          theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
          emojiStyle={EmojiStyle.APPLE}
          autoFocusSearch={false}
          width={320}
          height={400}
          lazyLoadEmojis={true}
          searchPlaceHolder="Search emojis..."
          skinTonesDisabled={false}
          previewConfig={{ showPreview: false }}
        />
      </div>
    </div>
  )
}
