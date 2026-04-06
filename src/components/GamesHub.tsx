'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, Trophy, Ghost, Grid3x3, ArrowLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import TicTacToe from './TicTacToe'
import clsx from 'clsx'
// ... rest of imports

const GAMES = [
  { id: 'tic-tac-toe', name: 'Tic Tac Toe', icon: <Grid3x3 size={24} />, description: 'Classic 2-player strategy', component: <TicTacToe /> },
  { id: 'snake', name: 'Memory Match', icon: <Ghost size={24} />, description: 'Test your brain (Coming soon!)', disabled: true },
  { id: 'leaderboard', name: 'Global Ranks', icon: <Trophy size={24} />, description: 'See who is the best', disabled: true }
]

export default function GamesHub() {
  const [activeGameId, setActiveGameId] = useState<string | null>(null)

  const activeGame = GAMES.find(g => g.id === activeGameId)

  return (
    <div className="flex-1 h-full bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-12 opacity-10 blur-3xl pointer-events-none">
        <div className="w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500 rounded-full animate-pulse" />
      </div>

      <header className="px-4 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
        <div className="flex flex-col gap-1 sm:gap-2">
          <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-3 mb-1"
          >
            <div className="p-2 sm:p-2.5 bg-indigo-600 rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-600/20 text-white">
              <Gamepad2 size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Play & Fun</h1>
          </motion.div>
          <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium tracking-wide">Challenge friends or sharpen skills.</p>
        </div>

        <Link
          href="/chat"
          className="flex items-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-black uppercase text-[10px] sm:text-xs tracking-widest rounded-xl sm:rounded-2xl shadow-xl shadow-black/5 border border-slate-100 dark:border-slate-800 hover:scale-105 active:scale-95 transition-all self-stretch sm:self-auto justify-center"
        >
          <MessageSquare size={14} className="text-indigo-600 sm:w-4 sm:h-4" />
          Back to Chats
        </Link>
      </header>

      <main className="flex-1 px-8 pb-10 relative z-10 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {!activeGameId ? (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {GAMES.map((game, i) => (
                <motion.button
                  key={game.id}
                  whileHover={!game.disabled ? { scale: 1.02, y: -5 } : {}}
                  whileTap={!game.disabled ? { scale: 0.98 } : {}}
                  onClick={() => !game.disabled && setActiveGameId(game.id)}
                  className={clsx(
                    "relative overflow-hidden p-8 rounded-[3rem] text-left transition-all group border-2",
                    game.disabled 
                        ? "bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed" 
                        : "bg-white dark:bg-slate-900 border-white dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10"
                  )}
                >
                  <div className={clsx(
                    "w-14 h-14 rounded-3xl flex items-center justify-center mb-6 shadow-sm shadow-black/5 transition-all text-white",
                    game.id === 'tic-tac-toe' ? "bg-blue-600" : (game.id === 'leaderboard' ? "bg-amber-500" : "bg-indigo-600")
                  )}>
                    {game.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">{game.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{game.description}</p>
                  </div>
                  {game.disabled && (
                      <span className="absolute top-6 right-8 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-3 py-1.5 rounded-full ring-1 ring-white/10 shadow-sm border border-black/5">Coming Soon</span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="game"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-8 py-10"
            >
              <button 
                onClick={() => setActiveGameId(null)}
                className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-xs hover:opacity-75 transition-opacity self-start"
              >
                <ArrowLeft size={16} />
                Back to Hub
              </button>
              
              <div className="w-full flex flex-col items-center gap-6">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{activeGame?.name}</h2>
                {activeGame?.component}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
