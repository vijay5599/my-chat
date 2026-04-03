'use client'

import { useState } from 'react'
import { Calendar, Clock, Send, X, AlertCircle } from 'lucide-react'

export default function ScheduleMessageModal({
  onClose,
  onSchedule
}: {
  onClose: () => void,
  onSchedule: (content: string, scheduledFor: string) => void
}) {
  const [content, setContent] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  // Get current local time in ISO format (truncated for datetime-local input)
  const getLocalISOString = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localTime = new Date(now.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
  };

  const currentISTMin = getLocalISOString();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !scheduledTime) return
    
    // We create a Date object and force it into a standard ISO UTC format
    // This ensures there is a 'Z' or '+00' at the end for the database
    const date = new Date(scheduledTime)
    const isoDateWithTimezone = date.toISOString()
    
    onSchedule(content, isoDateWithTimezone)
    
    console.log("Scheduling (UTC):", isoDateWithTimezone)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border dark:border-neutral-800 animate-in zoom-in-95 duration-300">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            <h3 className="font-bold">Schedule Message</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">
              Message Content
            </label>
            <textarea
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What would you like to say later?"
              className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all resize-none h-32"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1">
              Send Date & Time (IST)
            </label>
            <div className="relative">
              <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={currentISTMin}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
            <AlertCircle size={14} className="flex-shrink-0" />
            <p>Your message will be stored securely and sent automatically at the chosen time in IST.</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-bold rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || !scheduledTime}
              className="flex-1 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
