'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, X, Loader2 } from 'lucide-react'
import clsx from 'clsx'

export type ConfirmType = 'danger' | 'warning' | 'info'

interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmType
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const icons = {
  danger: <AlertTriangle className="text-red-500" size={24} />,
  warning: <AlertCircle className="text-amber-500" size={24} />,
  info: <Info className="text-blue-500" size={24} />
}

const colors = {
  danger: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
  warning: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
  info: 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
}

const backgrounds = {
  danger: 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20',
  warning: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20',
  info: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20'
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onCancel}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            {/* Decorative Header */}
            <div className={clsx("h-2 w-full", type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-600')} />

            <div className="p-8">
              <div className="flex items-start gap-5">
                <div className={clsx(
                  "shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border",
                  backgrounds[type]
                )}>
                  {icons[type]}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight mb-2">
                    {title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed">
                    {message}
                  </p>
                </div>
                <button 
                  onClick={onCancel}
                  disabled={isLoading}
                  className="shrink-0 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-8 flex items-center gap-3">
                {cancelText && (
                  <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200/50 dark:border-slate-700/50 disabled:opacity-50"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={clsx(
                    "flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2",
                    colors[type],
                    isLoading && "opacity-80 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
