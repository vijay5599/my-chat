import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import { redirect } from 'next/navigation'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch rooms
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch current user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-900 text-foreground overflow-hidden">
      <Sidebar rooms={rooms || []} userEmail={user.email} profile={profile} />
      <main className="flex-1 flex flex-col h-full bg-white dark:bg-black shadow-sm z-10">
        {children}
      </main>
    </div>
  )
}
