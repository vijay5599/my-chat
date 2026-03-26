import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/Sidebar'
import NavigationWrapper from '@/components/NavigationWrapper'
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
    <NavigationWrapper 
      sidebar={<Sidebar rooms={rooms || []} userEmail={user.email} profile={profile} />}
    >
      {children}
    </NavigationWrapper>
  )
}
