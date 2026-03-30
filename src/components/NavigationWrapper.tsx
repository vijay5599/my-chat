'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import clsx from 'clsx'

interface NavContextType {
  isSidebarOpen: boolean
  setIsSidebarOpen: (open: boolean) => void
  isMobile: boolean
}

const NavContext = createContext<NavContextType | undefined>(undefined)

export function useNav() {
  const context = useContext(NavContext)
  if (!context) throw new Error('useNav must be used within NavigationWrapper')
  return context
}

export default function NavigationWrapper({ 
  sidebar, 
  children 
}: { 
  sidebar: React.ReactNode
  children: React.ReactNode 
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setIsSidebarOpen(false)
      else setIsSidebarOpen(true)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <NavContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, isMobile }}>
      <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 text-foreground overflow-hidden relative">
        {/* Sidebar overlay for mobile */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity animate-in fade-in duration-300" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Container */}
        <div className={clsx(
          "h-full z-50 transition-all duration-300 ease-in-out bg-white dark:bg-neutral-800",
          isMobile
            ? "fixed left-0 top-0 bottom-0 shadow-2xl w-[min(18rem,calc(100%-1.5rem))]"
            : "relative border-r dark:border-neutral-700 w-72",
          !isSidebarOpen && (isMobile ? "-translate-x-full" : "w-0 overflow-hidden border-none")
        )}>
          {sidebar}
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-full bg-white dark:bg-black relative z-10 overflow-hidden">
          {children}
        </main>
      </div>
    </NavContext.Provider>
  )
}
