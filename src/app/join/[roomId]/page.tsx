import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { X } from 'lucide-react'

export default async function JoinRoomPage({
  params
}: {
  params: { roomId: string }
}) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/join/${roomId}`)
  }

  // 1. Attempt to add user to room immediately
  // This bypasses the need for the user to be able to SELECT the room first
  const { error: joinError } = await supabase
    .from('room_members')
    .insert([{ room_id: roomId, user_id: user.id }])

  // If already a member (23505), redirect to chat
  if (joinError && joinError.code === '23505') {
    redirect(`/chat/${roomId}`)
  }

  // If the room doesn't exist or other error
  if (joinError) {
    // 23503 is foreign key violation (room_id doesn't exist)
    const isInvalidRoom = joinError.code === '23503'
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center group">
           <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
             <X size={32} />
           </div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {isInvalidRoom ? 'Invalid Link' : 'Join Error'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {isInvalidRoom 
              ? 'This invite link is either invalid or the room no longer exists.' 
              : `Something went wrong: ${joinError.message}`}
          </p>
          <a href="/chat" className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors">
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  // 3. Successfully joined, redirect to the room
  redirect(`/chat/${roomId}`)
}
