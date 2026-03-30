# Room Rename Feature Plan

## ✅ Overview
Add a set of changes that allow a room owner to rename a room.

Goals:
- Allow room owner to rename room title
- Validate input (non-empty, length limit, optionally unique)
- Persist update to DB (`rooms.name`)
- Reflect updated name in real-time for all clients (sidebar and room header)
- Keep UX responsive with loading and error handling

## 1. Requirement summary

- Only owner can rename
- Rename entry in UI (pencil/edit button) in `ChatHeader` or room menu
- Submit form updates backend and UI
- Broadcast status via Realtime events

## 2. Data flow

1. User clicks edit icon in room header
2. Editable input modal appears (current room name)
3. User provides and submits new name
4. Client calls `renameRoom(roomId, newName)` server action
5. Server checks identity/ownership and validates new name
6. DB update: `rooms.update({ name: newName }).eq('id', roomId)`
7. Realtime broadcast example:
   - event: `room_updated` payload: `{ roomId, name: newName }`
8. All clients receive event and update UI:
   - `Sidebar` room list text
   - `ChatHeader` room name

## 3. Implementation tasks

### A) Backend action

- File: `src/app/chat/actions.ts`
- Add:
```ts
export async function renameRoom(roomId: string, newName: string) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const trimmed = newName.trim()
  if (!trimmed || trimmed.length < 3 || trimmed.length > 60) {
    throw new Error('Room name must be 3-60 chars')
  }

  const { data: room } = await supabase
    .from('rooms')
    .select('id, owner_id')
    .eq('id', roomId)
    .single()

  if (!room || room.owner_id !== user.id) {
    throw new Error('Forbidden')
  }

  const { error } = await supabase
    .from('rooms')
    .update({ name: trimmed })
    .eq('id', roomId)

  if (error) throw error

  return { success: true, room: { ...room, name: trimmed } }
}
```

### B) UI wire-up

#### ChatHeader

- Add props:
  - `onRename: (name: string) => void`
  - `isOwner: boolean`
- Add button + modal or inline editable label
- Save button calls `onRename(newName)`

#### ChatBox

- Holding room state
- Add callback `onRename` that performs the server action and updates local state object
- Send rename event via Realtime broadcast

### C) Sidebar updates

- Subscribe to `room_updated` events and update room list variable
- If current tray updates, re-render list and selected room name

### D) Realtime synchronization

In `ChatBox` or `Sidebar` shared channel:
- publish event on rename
- in other clients, update in-memory rooms state
- optionally store room name updates in local cache for quick refresh

### E) UX

- Add loader/disabled state while request is pending
- Toast success/failure
- Validation errors displayed close to input

## 4. Tests

- Owner successfully renames (UI + DB + broadcast)
- Non-owner forbidden
- Empty / too short / too long => validation error
- Real-time propagation across two clients

## 5. PR template

- Title: `feat(chat): add room rename support`
- Checklist:
  - [ ] backend action added
  - [ ] header UI + modal built
  - [ ] sidebar updates reflect rename
  - [ ] realtime broadcast handling
  - [ ] tests added for success and failure
  - [ ] docs/README updated

## 6. Extra scope (later)

- allow moderators to rename
- rename history/audit log
- rename for private rooms only
- backfill audit message into chat stream
