import { createClient } from '@/lib/supabase/server'
import ChatBox from '@/components/ChatBox'
import { redirect } from 'next/navigation'
import { Room } from '@/types'

export const metadata = {
  title: 'Aura AI Assistant | Aura Chat',
  description: 'Your private, ephemeral AI companion.',
}

export default async function AuraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Create a virtual room object for the AI
  const virtualRoom: Room = {
    id: 'virtual-aura',
    name: 'Aura AI Assistant',
    owner_id: user.id,
    created_at: new Date().toISOString(),
    type: 'public', // Set to public to force the name to display correctly in the header
    wallpaper_color: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Deep space vibe
  }

  // Initial greeting from Aura
  const initialMessages = [
    {
      id: 'welcome-aura',
      room_id: 'virtual-aura',
      user_id: '00000000-0000-0000-0000-000000000000',
      content: 'Greetings. I am Aura, your private AI assistant. This space is purely ephemeral—our conversation will vanish once you leave. How can I illuminate your journey today?',
      created_at: new Date().toISOString(),
      profiles: {
        id: '00000000-0000-0000-0000-000000000000',
        username: 'aura',
        avatar_url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=256&h=256&auto=format&fit=crop',
        updated_at: new Date().toISOString()
      }
    }
  ]

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_top_right,_#1e40af,_transparent)]" />
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_bottom_left,_#4c1d95,_transparent)]" />

      <ChatBox
        initialMessages={initialMessages as any}
        roomId="virtual-aura"
        currentUserId={user.id}
        room={virtualRoom}
        members={[]}
        isVirtual={true}
      />
    </div>
  )
}
