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

  // Fetch rooms: 
  // 1. All group rooms (publicly browseable)
  // 2. Only direct rooms where the user is a member
  // Let's first get the user's room IDs
  const { data: userMemberships } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('user_id', user.id)

  const joinedRoomIds = userMemberships?.map(m => m.room_id) || []

  // Fetch all rooms that are:
  // 1. 'group' AND NOT 'private'
  // 2. OR any room where the user is a member (handles DMs and private rooms they're in)
  const { data: allRooms } = await supabase
    .from('rooms')
    .select('*, room_members(user_id, profiles(*))')
    .or(`and(type.eq.group,is_private.eq.false),id.in.(${joinedRoomIds.length > 0 ? joinedRoomIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
    .order('created_at', { ascending: false })

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
