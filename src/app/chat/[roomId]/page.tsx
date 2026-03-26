import { createClient } from '@/lib/supabase/server'
import ChatBox from '@/components/ChatBox'
import { redirect } from 'next/navigation'
import { joinRoom } from '@/app/chat/actions'

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Attempt to join the room
  await joinRoom(resolvedParams.roomId)

  // Fetch initial messages with profiles
  const { data: messages } = await supabase
    .from('messages')
    .select('*, profiles(*)')
    .eq('room_id', resolvedParams.roomId)
    .order('created_at', { ascending: true })

  // Fetch room details
  const { data: room } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', resolvedParams.roomId)
    .single()

  if (!room) {
    return <div className="p-8 text-center text-red-500">Room not found</div>
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-black overflow-hidden relative">
      <ChatBox 
        initialMessages={messages || []} 
        roomId={resolvedParams.roomId} 
        currentUserId={user.id}
        room={room}
      />
    </div>
  )
}
