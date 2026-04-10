import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

  // 1. Check if room exists and get its info
  const { data: room, error } = await supabase
    .from('rooms')
    .select('id, name, is_private')
    .eq('id', roomId)
    .single()

  if (error || !room) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Room Not Found</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">This invite link may be invalid or the room has been deleted.</p>
          <a href="/chat" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Back to Chat</a>
        </div>
      </div>
    )
  }

  // 2. Add user to room
  // We use a direct insert to room_members here as the invite link acts as authorization
  const { error: joinError } = await supabase
    .from('room_members')
    .insert([{ room_id: roomId, user_id: user.id }])

  // If already a member, that's fine too (23505 is unique violation)
  if (joinError && joinError.code !== '23505') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error Joining Room</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{joinError.message}</p>
          <a href="/chat" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl font-bold">Back to Chat</a>
        </div>
      </div>
    )
  }

  // 3. Redirect to the room
  redirect(`/chat/${roomId}`)
}
