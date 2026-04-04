'use client'

import React, { useState, useEffect, useRef } from 'react'
import { GiphyFetch } from '@giphy/js-fetch-api'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Loader2, Sparkles, Cross } from 'lucide-react'
import clsx from 'clsx'

// Giphy Public Beta Key for testing purposes.
const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'dc6zaTOxFJmzC')

interface GifPickerProps {
  onSelect: (url: string) => void
  onClose: () => void
  className?: string
}

export default function GifPicker({ onSelect, onClose, className }: GifPickerProps) {
  const [search, setSearch] = useState('')
  const [gifs, setGifs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(['wow', 'happy', 'love', 'dance', 'laugh', 'wait', 'clap', 'party', 'fire', 'cool'])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true)
      try {
        const { data } = await gf.trending({ limit: 20 })
        setGifs(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchTrending()
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!search.trim()) return
      setLoading(true)
      try {
        const { data } = await gf.search(search, { limit: 20 })
        setGifs(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [search])

  const handleSuggestionClick = (tag: string) => {
    setSearch(tag)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className={clsx(
        "absolute bottom-full mb-4 w-[350px] h-[550px] bg-[#0c0d12] border border-white/10 flex flex-col p-6 rounded-[2.5rem] shadow-2xl z-[150] overflow-hidden backdrop-blur-3xl",
        className || "left-0"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex flex-col">
          <h3 className="font-serif font-bold text-2xl text-white tracking-tight flex items-center gap-2">
            Giphy Lab <Sparkles size={18} className="text-amber-400 animate-pulse" />
          </h3>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">The GIF Multiverse</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-white/40 hover:text-white transition-all transform active:scale-90 bg-white/5 border border-white/5"
        >
          <X size={22} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
        <input
          type="text"
          placeholder="Search cinematic GIFs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans shadow-inner"
        />
        <X size={22} onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 cursor-pointer hover:text-white transition-all" />
      </div>

      {/* Suggestion Bubbles (Auto-width) */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar scroll-smooth">
        {suggestions.map((tag) => (
          <button
            key={tag}
            onClick={() => handleSuggestionClick(tag)}
            className="px-4 py-1.5 bg-white/5 hover:bg-indigo-500/20 border border-white/5 hover:border-indigo-500/30 rounded-full text-[12px] font-bold text-white/60 hover:text-indigo-300 transition-all whitespace-nowrap flex-shrink-0 animate-in fade-in zoom-in duration-300 italic"
          >
            #{tag}
          </button>
        ))}
      </div>

      {/* Result Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative min-h-0">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0c0d12]/50 backdrop-blur-[2px] z-10 transition-all">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
            <p className="text-[10px] uppercase font-extrabold tracking-[0.3em] text-white/40 animate-pulse">Scanning the void...</p>
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-20 text-center gap-2">
            <Sparkles size={40} />
            <p className="text-[10px] uppercase tracking-[0.2em] font-extrabold">No GIFs found in this timeline</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3" ref={scrollRef}>
            {gifs.map((gif) => (
              <motion.button
                key={gif.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(gif.images.fixed_height.url)}
                className="relative aspect-video rounded-2xl overflow-hidden group bg-white/5 border border-white/5 shadow-lg"
              >
                <img
                  src={gif.images.fixed_height.url}
                  alt={gif.title}
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-2">
                  <p className="text-[8px] text-white/50 truncate w-full font-bold uppercase tracking-tighter">{gif.title || 'GIF'}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <p className="text-[9px] text-center text-white/20 uppercase tracking-[0.3em] font-black flex items-center justify-center gap-2">
          <span className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.8)]" />
          The Giphy Engine v2
        </p>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          display: block;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          transition: all 0.3s;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </motion.div>
  )
}
