export default function ChatMainLoading() {
  return (
    <div className="flex h-screen w-full bg-white dark:bg-black overflow-hidden animate-pulse">
      {/* Sidebar Skeleton */}
      <div className="w-80 border-r dark:border-neutral-800 flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 hidden md:flex">
        <div className="p-4 border-b dark:border-neutral-800 flex items-center justify-between">
          <div className="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
          <div className="h-8 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
        </div>
        
        <div className="p-4 border-b dark:border-neutral-800">
          <div className="h-10 w-full bg-neutral-100 dark:bg-neutral-950 rounded-lg" />
        </div>

        <div className="flex-1 p-4 space-y-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
                <div className="h-2 w-1/4 bg-neutral-100 dark:bg-neutral-900 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t dark:border-neutral-800 mt-auto">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
             <div className="space-y-2 flex-1">
                <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
                <div className="h-2 w-1/3 bg-neutral-100 dark:bg-neutral-900 rounded-md" />
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 flex flex-col h-full">
        <div className="border-b px-6 py-4 flex items-center justify-between shadow-sm bg-white dark:bg-black">
          <div className="flex items-center gap-3">
            <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-md" />
          </div>
          <div className="h-4 w-16 bg-neutral-100 dark:bg-neutral-900 rounded-md" />
        </div>

        <div className="flex-1 flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-900/10">
          <div className="text-center space-y-4">
             <div className="mx-auto w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                 <div className="w-8 h-8 rounded-full border-2 border-dashed border-blue-400 animate-spin" />
             </div>
             <div className="h-4 w-48 bg-neutral-100 dark:bg-neutral-800 rounded-md mx-auto" />
             <div className="h-3 w-32 bg-neutral-50 dark:bg-neutral-900 rounded-md mx-auto" />
          </div>
        </div>
      </div>
    </div>
  )
}
