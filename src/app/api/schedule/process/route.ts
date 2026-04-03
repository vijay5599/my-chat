import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Worker API Route to process scheduled messages.
 * This route should be triggered periodically by a CRON job (e.g., every 1 minute).
 * URL: /api/schedule/process
 */
export async function GET(request: Request) {
  try {
    // 1. Security Check: Verify secret key
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    const secret = process.env.CRON_SECRET || 'fallback_for_local_dev'

    if (key !== secret) {
      return NextResponse.json({ error: 'Unauthorized access.' }, { status: 401 })
    }

    const supabase = await createClient()

    // 1. Fetch pending messages that are now due (scheduled_for <= now)
    const { data: messages, error: fetchError } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())

    if (fetchError) {
      console.error('Error fetching scheduled messages:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'No messages due for scheduling at this time.' })
    }

    console.log(`Processing ${messages.length} scheduled messages...`)

    const results = []

    for (const msg of messages) {
      // 2. Insert into the main messages table
      const { data: insertedMsg, error: insertError } = await supabase
        .from('messages')
        .insert([{
          room_id: msg.room_id,
          user_id: msg.user_id,
          content: msg.content,
          created_at: msg.scheduled_for // Use the scheduled time as the message time
        }])
        .select()
        .single()

      if (insertError) {
        console.error(`Failed to send scheduled message ${msg.id}:`, insertError)
        results.push({ id: msg.id, status: 'error', error: insertError.message })
        continue
      }

      // 3. Update the status in scheduled_messages table
      const { error: updateError } = await supabase
        .from('scheduled_messages')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', msg.id)

      if (updateError) {
        console.error(`Failed to update status for message ${msg.id}:`, updateError)
        results.push({ id: msg.id, status: 'sent_but_status_update_failed', error: updateError.message })
      } else {
        results.push({ id: msg.id, status: 'sent' })
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: results.length, 
      details: results 
    })

  } catch (error: any) {
    console.error('Unexpected error in scheduling worker:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
