'use client'

import Image from 'next/image'

interface AvatarProps {
  url?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ url, name, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl'
  }

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500'
  ]
  
  // Deterministic color based on name
  const colorIndex = name ? name.length % colors.length : 0
  const bgColor = colors[colorIndex]

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden flex-shrink-0 relative flex items-center justify-center text-white font-medium ${bgColor}`}>
      {url ? (
        <Image
          src={url}
          alt={name || 'Avatar'}
          fill
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}
