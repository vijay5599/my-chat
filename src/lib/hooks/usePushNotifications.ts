'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const VAPID_PUBLIC_KEY = 'BPZhvCeHMKD2BRn25uDzzYVExpVBjdhnm39KMd2bv0cHQ7D5IXXXPm2aONz0dr6uGZ1pJ0ftRoA52YA8wkuKLGs'

export function usePushNotifications() {
  const [isSubscribing, setIsSubscribing] = useState(false)
  const supabase = createClient()

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const subscribeUser = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported in this browser.')
      return
    }

    setIsSubscribing(true)
    try {
      const registration = await navigator.serviceWorker.ready
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        })
      }

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: subscription.toJSON()
          }, { onConflict: 'user_id,subscription' })

        if (error) throw error
        console.log('Successfully subscribed to push notifications.')
      }
    } catch (err) {
      console.error('Failed to subscribe to push notifications:', err)
    } finally {
      setIsSubscribing(false)
    }
  }, [supabase])

  const unsubscribeUser = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        
        // Remove from Supabase
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('user_id', user.id)
            .eq('subscription->>endpoint', (subscription as any).endpoint)
        }
      }
    } catch (err) {
      console.error('Failed to unsubscribe from push notifications:', err)
    }
  }, [supabase])

  return { subscribeUser, unsubscribeUser, isSubscribing }
}
