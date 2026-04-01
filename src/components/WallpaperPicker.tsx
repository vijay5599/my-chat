'use client'

import * as React from 'react'
import { Palette, X, Image as ImageIcon, Check } from 'lucide-react'
import clsx from 'clsx'
import { updateRoomWallpaper } from '@/app/chat/actions'

const PRESET_COLORS = [
  '#f8fafc', // slate-50
  '#fecaca', // red-200
  '#bfdbfe', // blue-200
  '#bbf7d0', // green-200
  '#fef08a', // yellow-200
  '#ddd6fe', // violet-200
  '#fbcfe8', // pink-200
]

const PRESET_GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
  'linear-gradient(135deg, #c3cfe2 0%, #c3cfe2 100%)',
]

interface WallpaperPickerProps {
  roomId: string
  currentWallpaperColor?: string
  currentWallpaperUrl?: string
  onClose: () => void
}

export function WallpaperPicker({ roomId, currentWallpaperColor, currentWallpaperUrl, onClose }: WallpaperPickerProps) {
  const [color, setColor] = React.useState(currentWallpaperColor || '')
  const [url, setUrl] = React.useState(currentWallpaperUrl || '')
  const [isSaving, setIsSaving] = React.useState(false)

  const handleApply = async (newColor: string, newUrl: string) => {
    setIsSaving(true)
    const result = await updateRoomWallpaper(roomId, { color: newColor, url: newUrl })
    if (result.success) {
      onClose()
    } else {
      alert('Failed to save wallpaper')
    }
    setIsSaving(false)
  }

  return (
    <div className="p-4 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Palette size={16} className="text-blue-500" />
          Chat Wallpaper
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Presets */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Preset Colors</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleApply('', '')}
              className="w-8 h-8 rounded-lg border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors"
              title="Default"
            >
              <X size={12} className="text-slate-400" />
            </button>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => handleApply(c, '')}
                className={clsx(
                  "w-8 h-8 rounded-lg transition-transform hover:scale-110 active:scale-95 shadow-sm border border-black/5",
                  color === c && "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900"
                )}
                style={{ backgroundColor: c }}
              >
                {color === c && <Check size={12} className="mx-auto text-slate-800" />}
              </button>
            ))}
          </div>
        </div>

        {/* Gradients */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Gradients</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_GRADIENTS.map((g) => (
              <button
                key={g}
                onClick={() => handleApply(g, '')}
                className={clsx(
                  "w-12 h-8 rounded-lg transition-transform hover:scale-110 active:scale-95 shadow-sm",
                  color === g && "ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900"
                )}
                style={{ background: g }}
              />
            ))}
          </div>
        </div>

        {/* Custom URL */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Custom Image URL</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Paste image link..."
              className="flex-1 text-xs bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApply('', url)}
            />
            <button 
              onClick={() => handleApply('', url)}
              disabled={isSaving || !url.trim()}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <ImageIcon size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
