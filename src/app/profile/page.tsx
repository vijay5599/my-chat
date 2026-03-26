import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    // If profile doesn't exist (e.g. user was created before the trigger), 
    // create it now.
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert([
        { id: user.id, username: user.email?.split('@')[0] || 'User' }
      ])
      .select()
      .single()
    
    if (createError) {
      return (
        <div className="p-8 text-center text-red-500">
          Error initializing profile: {createError.message}
        </div>
      )
    }
    profile = newProfile
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/chat" 
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-foreground mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Chat
        </Link>
        <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
        <p className="text-neutral-500 mb-10">Customize how others see you in the chat.</p>
        
        <ProfileForm initialProfile={profile} />
      </div>
    </div>
  )
}
