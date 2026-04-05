import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "BPZhvCeHMKD2BRn25uDzzYVExpVBjdhnm39KMd2bv0cHQ7D5IXXXPm2aONz0dr6uGZ1pJ0ftRoA52YA8wkuKLGs";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "sjTHgVqPWfEGV-YcwHXiM1Jt382ei19JpVVIuVb2vnU";

webpush.setVapidDetails(
  "mailto:vijay.chat.app@gmail.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

serve(async (req) => {
  try {
    const { message_id, room_id, sender_id, content } = await req.json();

    // We use the service_role key to bypass RLS for lookups
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
    );

    // 1. Get sender's profile info
    const { data: sender } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', sender_id)
      .single();

    // 2. Get all room members (excluding the sender)
    const { data: members, error: memberError } = await supabase
      .from('room_members')
      .select('user_id')
      .eq('room_id', room_id)
      .neq('user_id', sender_id);

    if (memberError) throw memberError;
    console.log(`Found ${members?.length || 0} other members in room ${room_id}`);

    if (!members || members.length === 0) {
      console.log('No other members to notify.');
      return new Response(JSON.stringify({ success: true, message: 'No recipients found' }), { status: 200 });
    }

    // 3. Get their push subscriptions
    const userIds = members.map(m => m.user_id);
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', userIds);

    if (subError) throw subError;
    console.log(`Found ${subscriptions?.length || 0} active push subscriptions.`);

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No active subscriptions found for these members.');
      return new Response(JSON.stringify({ success: true, message: 'No subscriptions found' }), { status: 200 });
    }

    // 4. Send notifications to every device
    const sendPromises = (subscriptions || []).map(sub => {
      const iconUrl = sender?.avatar_url || 'https://puqyammoifaescdhnufl.supabase.co/storage/v1/object/public/voice-messages/icon-192.png';
      
      return webpush.sendNotification(
        sub.subscription,
        JSON.stringify({
          title: `Message from ${sender?.username || 'Someone'}`,
          body: content.length > 50 ? content.substring(0, 50) + '...' : content,
          tag: room_id,
          icon: iconUrl,
          badge: 'https://puqyammoifaescdhnufl.supabase.co/storage/v1/object/public/voice-messages/badge-icon.png',
          data: { roomId: room_id }
        })
      ).catch(err => {
        console.error('Push error for one subscriber:', err);
      });
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error('Edge Function Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
