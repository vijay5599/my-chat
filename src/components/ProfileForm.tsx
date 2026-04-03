'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Avatar } from '@/components/Avatar'
import { useRouter } from 'next/navigation'
import { Loader2, Upload, Check } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export default function ProfileForm({ initialProfile }: { initialProfile: Profile }) {
  const [username, setUsername] = useState(initialProfile.username || '')
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatar_url || '')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ 
        username,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', initialProfile.id)

    setLoading(false)
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      router.refresh()
    }
  }

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      if (!e.target.files || e.target.files.length === 0) return

      const file = e.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${initialProfile.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
      setMessage({ type: 'success', text: 'Avatar uploaded! Don\'t forget to save changes.' })
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-sm border dark:border-neutral-800">
      <div className="flex flex-col items-center mb-8">
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <Avatar url={avatarUrl} name={username} size="lg" />
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="text-white w-6 h-6" />
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center">
              <Loader2 className="text-white w-6 h-6 animate-spin" />
            </div>
          )}
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          hidden 
          accept="image/*" 
          onChange={handleUploadAvatar} 
          disabled={uploading}
        />
        <p className="mt-2 text-xs text-neutral-500">Click to change avatar</p>
      </div>

      <form onSubmit={handleUpdateProfile} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="CoolCat123"
            required
          />
        </div>

        <div className="pt-2">
          <label className="block text-sm font-medium mb-3">Appearance</label>
          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-xl border dark:border-neutral-700">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Switch Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {message.type === 'success' && <Check className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </form>
    </div>
  )
}
