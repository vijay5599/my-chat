import { PanelLeftClose } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-black overflow-hidden relative animate-pulse">
      {/* Header Skeleton */}
      <div className="border-b px-6 py-4 flex items-center justify-between shadow-sm bg-white dark:bg-black z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
            <div className="h-3 w-48 bg-neutral-100 dark:bg-neutral-900 rounded-md hidden md:block" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-neutral-200 dark:bg-neutral-800" />
          <div className="h-3 w-16 bg-neutral-100 dark:bg-neutral-900 rounded-md" />
        </div>
      </div>

      {/* Message List Skeleton */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0" />
            <div className={`flex flex-col space-y-1 max-w-[70%] ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
              <div className={`h-16 w-48 sm:w-64 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl ${i % 2 === 0 ? 'rounded-tr-none' : 'rounded-tl-none'}`} />
              <div className="h-2 w-12 bg-neutral-50 dark:bg-neutral-900 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Input Skeleton */}
      <div className="p-4 bg-white dark:bg-black border-t dark:border-neutral-800">
        <div className="flex items-end gap-2 max-w-5xl mx-auto">
          <div className="flex-1 h-12 bg-neutral-100 dark:bg-neutral-900 rounded-2xl" />
          <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
