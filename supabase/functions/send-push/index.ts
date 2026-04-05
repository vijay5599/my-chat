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

    // 1. Get all room members (excluding the sender)
    const { data: members, error: memberError } = await supabase
      .from('room_members')
      .select('user_id')
      .eq('room_id', room_id)
      .neq('user_id', sender_id);

    if (memberError) throw memberError;

    // 2. Get their push subscriptions from our new table
    const userIds = members.map(m => m.user_id);
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .in('user_id', userIds);

    if (subError) throw subError;

    // 3. Send notifications to every device
    const sendPromises = (subscriptions || []).map(sub => {
      return webpush.sendNotification(
        sub.subscription,
        JSON.stringify({
          title: `New Message`,
          body: content.length > 50 ? content.substring(0, 50) + '...' : content,
          tag: room_id,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          data: { roomId: room_id }
        })
      ).catch(err => {
        console.error('Push error for one subscriber:', err);
        // If the subscription is gone (410 Gone / 404), we should ideally remove it here
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
