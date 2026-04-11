/**
 * Deterministic Room Identity Generator
 * Generates unique mottos, colors, and stats based on room data.
 */

import { Room } from '@/types'

const MOTTOS = [
  "Where deep conversations find a home.",
  "Architecting the future, one message at a time.",
  "Synthesizing ideas into collective reality.",
  "A high-fidelity sanctuary for your thoughts.",
  "Level up your perspective and your projects.",
  "Connecting the dots across the digital void.",
  "Your central hub for high-intensity collaboration.",
  "Where logic meets creativity and community.",
  "The heartbeat of your digital inner circle.",
  "Minimalist space for maximalist ideas.",
  "Secure, seamless, and spectacularly Aura.",
  "Aura: Experience the next level of messaging.",
  "The frontier of real-time human connection.",
  "Your thoughts, amplified and synchronized.",
  "Where the collective mind finds its flow."
]

const VIBES = ["Zen", "Energetic", "Professional", "Casual", "Cyberpunk", "Minimalist", "Cozy", "High-Octane"]
const ACTIVITY = ["⚡ High Intensity", "🌊 Deep Flow", "🍃 Serene", "🔥 Trending", "🧘 Focused", "✨ Sparkling"]

const GRADIENTS = [
  "from-indigo-500 via-purple-500 to-pink-500",
  "from-blue-600 via-cyan-500 to-teal-400",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-orange-500 via-red-500 to-rose-600",
  "from-violet-600 via-indigo-600 to-blue-700",
  "from-amber-400 via-orange-500 to-yellow-600",
  "from-slate-700 via-slate-800 to-slate-900"
]

/**
 * Deterministically generates an identity for a room based on its ID.
 */
export function getRoomIdentity(room: Room) {
  // Use room ID as a seed for stable "randomness"
  const seed = room.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  const mottoIndex = seed % MOTTOS.length
  const vibeIndex = (seed + 1) % VIBES.length
  const activityIndex = (seed + 2) % ACTIVITY.length
  const gradientIndex = (seed + 3) % GRADIENTS.length
  
  // Established date based on room creation or just a fun "random" one if missing
  const estDate = room.created_at ? new Date(room.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'April 2026'

  return {
    motto: MOTTOS[mottoIndex],
    vibe: VIBES[vibeIndex],
    activity: ACTIVITY[activityIndex],
    gradient: GRADIENTS[gradientIndex],
    established: estDate,
    reliability: "99.9% Synchronized",
    avatarUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${room.id}&backgroundColor=ffffff,b6e3f4,c0aede,d1d4f9,ffdfbf`
  }
}
