'use client'

import { useNav } from '@/components/NavigationWrapper'
import { Menu } from 'lucide-react'

export default function ChatIndexPage() {
  const { setIsSidebarOpen, isMobile } = useNav()

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(148,163,184,0.08),_transparent_70%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.25),_rgba(15,23,42,0.8)_70%)]">
      {/* Lobby Header for Mobile Toggle */}
      {isMobile && (
        <div className="border-b px-6 py-4 flex items-center gap-3 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md z-20">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-neutral-500"
          >
            <Menu size={22} />
          </button>
          <h2 className="font-semibold text-lg">Chat</h2>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center p-8 text-center text-neutral-500">
        <div className="max-w-md">
          <h2 className="text-2xl font-semibold mb-2 text-foreground">Welcome to Realtime Chat</h2>
          <p className="mb-6">Select a room from the sidebar or construct a new one to begin.</p>
          
          {isMobile && (
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-lg active:scale-95"
            >
              Open Rooms List
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

