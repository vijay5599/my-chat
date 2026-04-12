import React from 'react';

export default function GamesLoading() {
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900/40 p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-4 w-64 bg-slate-100 dark:bg-slate-900 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </div>

      {/* Game Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-blue-100 dark:bg-blue-900/30 rounded-md" />
              <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-900 rounded-md" />
            </div>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
               <div className="h-10 w-full bg-slate-50 dark:bg-slate-950 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
