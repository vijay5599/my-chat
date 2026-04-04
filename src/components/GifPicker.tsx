'use client'

import { useState, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface GIF {
  id: string
  url: string
  previewUrl: string
  title: string
  tags: string[]
}

// Curated "Cinematic Noir" Mock Gallery to ensure 100% reliability without API keys
const MOCK_GIFS: GIF[] = [
  { id: '1', title: 'Cinematic Wow', tags: ['wow', 'amazing', 'shock'], url: 'https://media.giphy.com/media/l41lTfO7r19Q5uV8Q/giphy.gif', previewUrl: 'https://media.giphy.com/media/l41lTfO7r19Q5uV8Q/giphy.gif' },
  { id: '2', title: 'Obsidian Smile', tags: ['smile', 'happy', 'love'], url: 'https://media.giphy.com/media/3o7TKoWXm7okS9S9K8/giphy.gif', previewUrl: 'https://media.giphy.com/media/3o7TKoWXm7okS9S9K8/giphy.gif' },
  { id: '3', title: 'Noir Party', tags: ['party', 'dance', 'celebrate'], url: 'https://media.giphy.com/media/3o7TKDkDbIDJ98Bx3G/giphy.gif', previewUrl: 'https://media.giphy.com/media/3o7TKDkDbIDJ98Bx3G/giphy.gif' },
  { id: '4', title: 'Deep Laugh', tags: ['laugh', 'funny', 'lol'], url: 'https://media.giphy.com/media/l0ExaymExw2HIKZ9u/giphy.gif', previewUrl: 'https://media.giphy.com/media/l0ExaymExw2HIKZ9u/giphy.gif' },
  { id: '5', title: 'Void Wait', tags: ['wait', 'loading', 'think'], url: 'https://media.giphy.com/media/3o7TKVUn7iM8FMEU24/giphy.gif', previewUrl: 'https://media.giphy.com/media/3o7TKVUn7iM8FMEU24/giphy.gif' },
  { id: '6', title: 'Dark Clap', tags: ['clap', 'bravo', 'win'], url: 'https://media.giphy.com/media/3o7TKVUn7iM8FMEU24/giphy.gif', previewUrl: 'https://media.giphy.com/media/3o7TKVUn7iM8FMEU24/giphy.gif' }
]

export default function GifPicker({ onSelect, onClose }: { onSelect: (url: string) => void, onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [gifs, setGifs] = useState<GIF[]>(MOCK_GIFS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const filterGifs = () => {
      if (!search.trim()) {
        setGifs(MOCK_GIFS)
        return
      }
      setLoading(true)
      const query = search.toLowerCase()
      const filtered = MOCK_GIFS.filter(g => 
        g.title.toLowerCase().includes(query) || 
        g.tags.some(t => t.includes(query))
      )
      
      // Simulate network delay for that premium feel
      setTimeout(() => {
        setGifs(filtered)
        setLoading(false)
      }, 300)
    }

    filterGifs()
  }, [search])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="absolute bottom-full left-0 mb-4 w-[340px] h-[400px] bg-[#0f1117] border border-white/10 flex flex-col p-4 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-serif font-bold text-lg text-white/90">Cinematic Picks</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-all">
          <X size={18} />
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
        <input
          type="text"
          placeholder="Search cinematic reactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border-none rounded-xl pl-9 pr-4 py-2.5 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:bg-white/10 transition-all font-sans"
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
            <Loader2 className="animate-spin text-indigo-400" size={24} />
            <p className="text-[10px] uppercase font-bold tracking-widest">Searching the void...</p>
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex items-center justify-center h-full opacity-30 text-[10px] uppercase tracking-widest">
            No reactions found in the void
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {gifs.map((gif) => (
              <motion.button
                key={gif.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(gif.url)}
                className="relative aspect-video rounded-xl overflow-hidden group bg-white/5 border border-white/5"
              >
                <img 
                  src={gif.previewUrl} 
                  alt={gif.title} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
      
      <p className="text-[9px] text-center text-white/20 mt-3 uppercase tracking-tighter font-bold">
        Cinematic Hall of Fame
      </p>
    </motion.div>
  )
}
