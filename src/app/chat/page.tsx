'use client'

import { useState, useEffect } from 'react'
import { useNav } from '@/components/NavigationWrapper'
import { Menu, MessageSquare, Hash, Users, Sparkles, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDashboardStats } from './actions'
import Link from 'next/link'
import Image from 'next/image'
import clsx from 'clsx'

export default function ChatIndexPage() {
  const { setIsSidebarOpen, isMobile } = useNav()
  const [stats, setStats] = useState<{
    roomsCount: number
    messagesCount: number
    totalMembers: number
    recentRooms: any[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      const res = await getDashboardStats()
      if (!('error' in res)) {
        setStats(res)
      }
      setLoading(false)
    }
    loadStats()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-neutral-50 dark:bg-neutral-950">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/10 dark:bg-purple-600/10 blur-[120px]" />
      </div>

      {/* Header for Mobile */}
      {isMobile && (
        <div className="sticky top-0 border-b px-6 py-4 flex items-center gap-3 bg-white/80 dark:bg-neutral-900/90 backdrop-blur-md z-20">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors text-neutral-500"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <MessageSquare size={16} />
            </div>
            <h2 className="font-bold text-lg tracking-tight">Dashboard</h2>
          </div>
        </div>
      )}

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col p-6 md:p-10 lg:p-16 z-10 max-w-6xl mx-auto w-full"
      >
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <motion.div variants={itemVariants} className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider uppercase border border-blue-100 dark:border-blue-800">
              <Sparkles size={12} />
              Welcome Back
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1]">
              Your Digital <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">
                Command Center
              </span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto lg:mx-0">
              Select a communication channel from the portal or launch a new workspace to collaborate with your team instantly.
            </p>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 active:scale-95 flex items-center gap-2"
              >
                Open Channels <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full scale-75" />
            <Image 
              src="/dashboard-illustration.png" 
              alt="Welcome Illustration" 
              width={600} 
              height={600} 
              className="relative z-10 animate-float pointer-events-none drop-shadow-2xl"
              priority
            />
          </motion.div>
        </div>

        {/* Stats Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          <StatsCard 
            icon={<Hash className="text-blue-500" />} 
            label="Joined Channels" 
            value={stats?.roomsCount ?? 0} 
            loading={loading}
          />
          <StatsCard 
            icon={<MessageSquare className="text-indigo-500" />} 
            label="Messages Sent" 
            value={stats?.messagesCount ?? 0} 
            loading={loading}
          />
          <StatsCard 
            icon={<Users className="text-emerald-500" />} 
            label="Global Community" 
            value={stats?.totalMembers ?? 0} 
            loading={loading}
          />
        </motion.div>

        {/* Recent Activity */}
        <AnimatePresence>
          {stats?.recentRooms && stats.recentRooms.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Recent Chats</h3>
                <Link href="#" onClick={() => setIsSidebarOpen(true)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.recentRooms.map((room) => (
                  <Link 
                    key={room.id}
                    href={`/chat/${room.id}`}
                    className="group bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-4 rounded-2xl flex items-center gap-4 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-600 dark:text-neutral-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <Hash size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate text-slate-800 dark:text-slate-100">{room.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-blue-500/70 transition-colors">Jump back in →</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

function StatsCard({ icon, label, value, loading }: { icon: React.ReactNode, label: string, value: number, loading: boolean }) {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 group">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-neutral-800 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <span className="text-sm font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        {loading ? (
          <div className="h-9 w-20 bg-slate-100 dark:bg-neutral-800 animate-pulse rounded-lg" />
        ) : (
          <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">
            {value.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  )
}

