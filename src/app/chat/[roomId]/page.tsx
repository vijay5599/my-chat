import { createClient } from '@/lib/supabase/server'
import ChatBox from '@/components/ChatBox'
import { redirect } from 'next/navigation'
import { requestToJoinRoom, getRoomMembers, getPendingRequests } from '@/app/chat/actions'
import { Lock, Clock, Check } from 'lucide-react'

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', resolvedParams.roomId)
    .eq('user_id', user.id)
    .single()

  // Check for pending request if not member
  let pendingRequest = null
  if (!membership) {
    const { data: request } = await supabase
      .from('room_join_requests')
      .select('*')
      .eq('room_id', resolvedParams.roomId)
      .eq('user_id', user.id)
      .single()
    pendingRequest = request
  }

  // Fetch room details
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', resolvedParams.roomId)
    .single()
    
  if (roomError || !room) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-lg font-bold text-red-500">Room not found</h3>
        <a href="/chat" className="mt-4 text-blue-500 hover:underline">Back to lobby</a>
      </div>
    )
  }

  if (!membership) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white dark:from-blue-950/20 dark:via-black dark:to-black">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl p-8 border border-neutral-100 dark:border-neutral-800 text-center space-y-8 relative overflow-hidden group">
          {/* Decorative element */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400" />
          
          <div className="mx-auto w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 ring-8 ring-blue-50/50 dark:ring-blue-900/5 transition-transform group-hover:scale-105 duration-500">
            {pendingRequest?.status === 'pending' 
              ? <Clock size={48} className="animate-pulse" /> 
              : <Lock size={48} className="transition-all" />}
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">{room.name}</h2>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              <span className="px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase font-bold tracking-widest rounded-full border dark:border-neutral-700">
                Private Room
              </span>
              {pendingRequest?.status === 'pending' && (
                <span className="px-2.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-[10px] uppercase font-bold tracking-widest rounded-full border border-yellow-200 dark:border-yellow-900/50">
                  Pending Approval
                </span>
              )}
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-[280px] mx-auto">
              {pendingRequest?.status === 'pending' 
                ? "The owner has been notified of your interest. You'll gain access once they approve your request." 
                : "This conversation is restricted to approved members only. Click below to request an invitation."}
            </p>
          </div>

          <div className="pt-4">
            {pendingRequest?.status === 'pending' ? (
              <div className="py-4 px-6 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-2xl border border-yellow-100 dark:border-yellow-900/30 flex items-center justify-center gap-3">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                <span className="text-sm font-semibold">Awaiting Review</span>
              </div>
            ) : (
              <form action={async () => {
                'use server'
                await requestToJoinRoom(resolvedParams.roomId)
              }}>
                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl transition-all shadow-xl shadow-blue-500/30 active:scale-[0.98] hover:-translate-y-0.5"
                >
                  Request to Join
                </button>
              </form>
            )}
          </div>
          
          <div className="pt-2">
            <a href="/chat" className="text-sm font-medium text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1">
              <span>← Back to all chats</span>
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Fetch initial messages with profiles and replied message context
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*, profiles(username, avatar_url, id), replied_message:reply_to_id(*, profiles(username, avatar_url, id))')
    .eq('room_id', resolvedParams.roomId)
    .order('created_at', { ascending: true })

  if (messagesError) {
    console.error('Error fetching messages:', messagesError)
  }

  // Fetch room members for mentions
  const { data: members } = await getRoomMembers(resolvedParams.roomId)

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
        members={members || []}
      />
    </div>
  )
}
