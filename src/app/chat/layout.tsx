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

  // Fetch rooms (all rooms for sidebar browsing)
  const { data: allRooms } = await supabase
    .from('rooms')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch current user memberships
  const { data: userMemberships } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('user_id', user.id)

  const joinedRoomIds = userMemberships?.map(m => m.room_id) || []

  // Fetch current user's join requests
  const { data: userRequests } = await supabase
    .from('room_join_requests')
    .select('room_id, status')
    .eq('user_id', user.id)

  const joinRequests = userRequests || []

  // Fetch current user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <NavigationWrapper 
      currentUserId={user.id}
      allRooms={allRooms || []}
      sidebar={
        <Sidebar 
          rooms={allRooms || []} 
          joinedRoomIds={joinedRoomIds} 
          joinRequests={joinRequests}
          userEmail={user.email} 
          profile={profile} 
        />
      }
    >
      {children}
    </NavigationWrapper>
  )
}
