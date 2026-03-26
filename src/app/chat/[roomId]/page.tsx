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
  const { error: joinError } = await joinRoom(resolvedParams.roomId)

  if (joinError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-red-500">
        <h3 className="text-lg font-bold">Failed to join room</h3>
        <p className="text-sm opacity-80">{joinError}</p>
        <a href="/chat" className="mt-4 text-blue-500 hover:underline">Back to lobby</a>
      </div>
    )
  }

  // Fetch initial messages with profiles
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*, profiles(username, avatar_url, id)')
    .eq('room_id', resolvedParams.roomId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    console.error('Error fetching messages:', messagesError)
  }

  // Fetch room details
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', resolvedParams.roomId)
    .single()
    
  if (roomError) {
    console.error('Error fetching room:', roomError)
  }


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
