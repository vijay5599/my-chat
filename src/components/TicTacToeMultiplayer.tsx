'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Trophy, User, Target } from 'lucide-react'
import clsx from 'clsx'
import confetti from 'canvas-confetti'

type Player = 'X' | 'O' | null

interface TicTacToeMultiplayerProps {
  board: Player[]
  isXNext: boolean
  winner: Player | 'Draw'
  winningLine: number[] | null
  onMove: (index: number) => void
  onReset: () => void
  isMyTurn: boolean
  players: {
    X: { id: string; username: string }
    O: { id: string; username: string }
  }
  myPlayer: 'X' | 'O' | null
  isMe?: boolean
}

export default function TicTacToeMultiplayer({
  board,
  isXNext,
  winner,
  winningLine,
  onMove,
  onReset,
  isMyTurn,
  players,
  myPlayer,
  isMe
}: TicTacToeMultiplayerProps) {
  
  React.useEffect(() => {
    if (winner && winner !== 'Draw' && winner === myPlayer) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: winner === 'X' ? ['#3b82f6', '#60a5fa'] : ['#f43f5e', '#fb7185']
      });
    }
  }, [winner, myPlayer]);

  const currentPlayer = isXNext ? 'X' : 'O'

  return (
    <div className={clsx(
      "flex flex-col items-center justify-center p-3 sm:p-5 bg-white dark:bg-slate-900/50 backdrop-blur-md shadow-xl border border-slate-100 dark:border-slate-800 w-auto min-w-[260px] sm:min-w-[320px] mx-auto my-2 transition-all",
      isMe ? "rounded-2xl rounded-tr-none" : "rounded-2xl rounded-tl-none"
    )}>
      <div className="flex items-center justify-between w-full mb-4 sm:mb-6 px-1">
        <div className={clsx(
          "flex flex-col items-center gap-1 transition-all duration-300",
          isXNext && !winner ? "scale-105 opacity-100" : "opacity-40 scale-95"
        )}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-lg shadow-sm border border-blue-200/50">X</div>
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-500 truncate max-w-[60px]">
            {players.X.username} {myPlayer === 'X' && "(You)"}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center">
          {winner ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-0.5"
            >
              <Trophy className="text-amber-500" size={16} />
              <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-500 tracking-tight">
                {winner === 'Draw' ? "Draw!" : (winner === myPlayer ? "You won!" : "You lost")}
              </span>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 uppercase tracking-widest">Turn</span>
              <div className={clsx(
                "h-1 w-6 rounded-full mt-1",
                isXNext ? "bg-blue-500" : "bg-rose-500"
              )} />
            </div>
          )}
        </div>

        <div className={clsx(
          "flex flex-col items-center gap-1 transition-all duration-300",
          !isXNext && !winner ? "scale-105 opacity-100" : "opacity-40 scale-95"
        )}>
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 font-black text-lg shadow-sm border border-rose-200/50">O</div>
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-500 truncate max-w-[60px]">
            {players.O.username} {myPlayer === 'O' && "(You)"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-4 sm:mb-6">
        {board.map((square, i) => {
          const isWinningSquare = winningLine?.includes(i)
          const canMove = !square && !winner && isMyTurn
          
          return (
            <motion.button
              key={i}
              whileHover={canMove ? { scale: 1.05, backgroundColor: 'rgba(59, 130, 246, 0.05)' } : {}}
              whileTap={canMove ? { scale: 0.95 } : {}}
              onClick={() => canMove && onMove(i)}
              disabled={!canMove}
              className={clsx(
                "w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-2xl font-black transition-all duration-200 border-2",
                !square
                  ? (canMove 
                      ? "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 cursor-pointer shadow-inner" 
                      : "bg-slate-100/50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 cursor-not-allowed opacity-80")
                  : (isWinningSquare
                    ? "bg-amber-100 dark:bg-amber-900/30 border-amber-400 shadow-lg"
                    : (square === 'X'
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500/30 text-blue-600"
                      : "bg-rose-50 dark:bg-rose-900/20 border-rose-500/30 text-rose-600"))
              )}
            >
              {square && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center select-none"
                >
                  {square}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      {winner && (
        <button
          onClick={onReset}
          className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg"
        >
          <RotateCcw size={14} />
          Play Again
        </button>
      )}

      {!winner && !isMyTurn && (
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider animate-pulse">
           <Target size={12} />
           Waiting for {currentPlayer === 'X' ? players.X.username : players.O.username}...
        </div>
      )}
      
      {!winner && isMyTurn && (
        <div className="flex items-center gap-2 text-[10px] text-blue-500 font-black uppercase tracking-widest">
           <Target size={12} className="animate-bounce" />
           Your Turn! Make a move
        </div>
      )}
    </div>
  )
}
