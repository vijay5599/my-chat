'use client'

import { motion } from 'framer-motion'

export function TypingAnimation({ names }: { names: string[] }) {
  if (names.length === 0) return null

  const text = names.length === 1
    ? `${names[0]} IS TYPING...`
    : names.length === 2
      ? `${names[0]} & ${names[1]} ARE TYPING...`
      : 'SEVERAL PEOPLE ARE TYPING...'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 dark:bg-black/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-full shadow-lg"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15
            }}
            className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full"
          />
        ))}
      </div>
      <span className="text-[10px] font-black lowercase tracking-widest text-green-700 dark:text-green-300 leading-none">
        {text}
      </span>
    </motion.div>
  )
}
