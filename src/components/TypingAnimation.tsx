'use client'

export function TypingAnimation({ names = [] }: { names?: string[] }) {
  const getLabel = () => {
    if (names.length === 0) return 'Several people are typing'
    if (names.length === 1) return `${names[0]} is typing...`
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`
    return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-2xl rounded-bl-sm w-fit border border-neutral-200 dark:border-neutral-700 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex gap-1 items-center mr-1">
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
      </div>
      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider whitespace-nowrap">
        {getLabel()}
      </span>
    </div>
  )
}
