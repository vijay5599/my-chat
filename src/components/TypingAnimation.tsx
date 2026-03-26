'use client'

export function TypingAnimation() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-2xl rounded-bl-sm w-fit border border-neutral-200 dark:border-neutral-700 shadow-sm transition-all duration-300 translate-y-0 opacity-100">
      <div className="flex gap-1 items-center">
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"></span>
      </div>
      <span className="text-[10px] text-neutral-500 font-medium ml-2 uppercase tracking-wider">typing</span>
    </div>
  )
}
