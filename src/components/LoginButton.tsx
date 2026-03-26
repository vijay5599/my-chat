'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export function LoginButton({ text, colorClass = 'bg-blue-600' }: { text: string, colorClass?: string }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${colorClass} text-white rounded-md px-4 py-2 mb-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95`}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {text}
    </button>
  )
}
