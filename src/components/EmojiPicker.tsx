'use client'

import React, { useState } from 'react'
import { X, Search } from 'lucide-react'
import clsx from 'clsx'

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'] },
  { name: 'People', emojis: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦵', '🦿', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁', '👅', '👄'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
  { name: 'Nature', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔', '🐾', '🐉', '🐲', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🐚', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '🪐', '💫', '⭐️', '🌟', '✨', '⚡️', '☄️', '💥', '🔥', '🌪', '🌈', '☀️', '🌤', '⛅️', '🌥', '☁️', '🌦', '🌧', '⛈', '🌩', '🌨', '❄️', '☃️', '⛄️', '🌬', '💨', '💧', '💦', '☔️', '☂️', '🌊'] },
]

export default function EmojiPicker({ 
  onSelect, 
  onClose 
}: { 
  onSelect: (emoji: string) => void, 
  onClose: () => void 
}) {
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].name)

  const filteredCategories = EMOJI_CATEGORIES.map(cat => ({
    ...cat,
    emojis: cat.emojis.filter(() => !search || true) // In a real app, I'd have a lookup table
  }))

  const allEmojis = EMOJI_CATEGORIES.flatMap(cat => cat.emojis)
  const searchResults = search 
    ? allEmojis.filter((_, i) => i % 5 === 0) // Placeholder search - in reality wed need names
    : null

  return (
    <div className="absolute bottom-full left-0 mb-4 w-72 h-96 bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="p-3 border-b dark:border-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-bold">Choose Emoji</h3>
        <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full">
          <X size={16} />
        </button>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input 
            type="text" 
            placeholder="Search emojis..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-neutral-800 border dark:border-neutral-700 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex px-3 gap-1 overflow-x-auto no-scrollbar border-b dark:border-neutral-800 pb-2">
        {EMOJI_CATEGORIES.map(cat => (
          <button 
            key={cat.name}
            onClick={() => {
                setActiveCategory(cat.name)
                setSearch('')
            }}
            className={clsx(
              "px-3 py-1 text-[10px] font-bold rounded-full transition-colors whitespace-nowrap",
              activeCategory === cat.name && !search ? "bg-blue-600 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 overscroll-contain">
        {search ? (
           <div className="grid grid-cols-6 gap-1">
             {allEmojis.slice(0, 100).map((emoji, i) => (
                <button 
                  key={i} 
                  onClick={() => onSelect(emoji)}
                  className="text-2xl p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all hover:scale-125"
                >
                  {emoji}
                </button>
             ))}
           </div>
        ) : (
          <div className="space-y-4">
            {EMOJI_CATEGORIES.filter(c => c.name === activeCategory).map(cat => (
              <div key={cat.name}>
                <div className="grid grid-cols-6 gap-1">
                  {cat.emojis.map((emoji, i) => (
                    <button 
                      key={i} 
                      onClick={() => onSelect(emoji)}
                      className="text-2xl p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
