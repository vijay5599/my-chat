'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, Trophy, User, Monitor } from 'lucide-react'
import clsx from 'clsx'

type Player = 'X' | 'O' | null

export default function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null))
  const [isXNext, setIsXNext] = useState(true)
  const [winner, setWinner] = useState<Player | 'Draw'>(null)
  const [winningLine, setWinningLine] = useState<number[] | null>(null)

  const calculateWinner = (squares: Player[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diags
    ]
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i]
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] }
      }
    }
    if (!squares.includes(null)) return { winner: 'Draw' as const, line: null }
    return null
  }

  const handleClick = (i: number) => {
    if (board[i] || winner) return
    const newBoard = [...board]
    newBoard[i] = isXNext ? 'X' : 'O'
    setBoard(newBoard)

    const result = calculateWinner(newBoard)
    if (result) {
      setWinner(result.winner)
      setWinningLine(result.line)
    } else {
      setIsXNext(!isXNext)
    }
  }

  const resetGame = () => {
    setBoard(Array(9).fill(null))
    setIsXNext(true)
    setWinner(null)
    setWinningLine(null)
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 max-w-sm w-full mx-auto">
      <div className="flex items-center justify-center w-full mb-6 sm:mb-8">
        <div className={clsx(
          "flex flex-col items-center gap-1 transition-all duration-300",
          isXNext && !winner ? "scale-110 opacity-100" : "opacity-40 scale-95"
        )}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-black text-xl sm:text-2xl shadow-sm">X</div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Player 1</span>
        </div>

        <div className="flex flex-col items-center flex-1">
          {winner ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center gap-1"
            >
              <Trophy className="text-amber-500 mb-0.5" size={20} />
              <span className="text-[11px] sm:text-sm font-black uppercase text-amber-500 tracking-tighter">
                {winner === 'Draw' ? "Draw!" : `P${winner} Wins!`}
              </span>
            </motion.div>
          ) : (
            <span className="text-[10px] sm:text-xs font-bold text-slate-300 uppercase tracking-widest">Vs</span>
          )}
        </div>

        <div className={clsx(
          "flex flex-col items-center gap-1 transition-all duration-300",
          !isXNext && !winner ? "scale-110 opacity-100" : "opacity-40 scale-95"
        )}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 font-black text-xl sm:text-2xl shadow-sm">O</div>
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">Player 2</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 sm:mb-8 mx-auto">
        {board.map((square, i) => {
          const isWinningSquare = winningLine?.includes(i)
          return (
            <motion.button
              key={i}
              whileHover={!square && !winner ? { backgroundColor: 'rgba(59, 130, 246, 0.05)' } : {}}
              onClick={() => handleClick(i)}
              className={clsx(
                "w-[82px] h-[82px] sm:w-[100px] sm:h-[100px] rounded-2xl flex items-center justify-center text-3xl font-black transition-colors duration-200 border-2",
                !square
                  ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800/40"
                  : (isWinningSquare
                    ? "bg-amber-100 dark:bg-amber-900/30 border-amber-400 shadow-lg"
                    : (square === 'X'
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500/50 text-blue-600"
                      : "bg-rose-50 dark:bg-rose-900/20 border-rose-500/50 text-rose-600"))
              )}
            >
              {square && (
                <motion.span
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center justify-center select-none pointer-events-none"
                >
                  {square}
                </motion.span>
              )}
            </motion.button>
          )
        })}
      </div>

      <button
        onClick={resetGame}
        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-black/10 dark:shadow-white/10"
      >
        <RotateCcw size={16} />
        Reset Game
      </button>
    </div>
  )
}
