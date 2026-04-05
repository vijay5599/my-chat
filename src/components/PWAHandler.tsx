'use client'

import { useEffect } from 'react'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'

export default function PWAHandler() {
  const { subscribeUser } = usePushNotifications()

  useEffect(() => {
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister()
          }
        }).finally(() => {
          navigator.serviceWorker.register('/sw.js').then(
            (registration) => {
              console.log('ServiceWorker registration successful with scope: ', registration.scope)
              // Subscribe the user for background notifications
              subscribeUser()
            },
            (err) => {
              console.log('ServiceWorker registration failed: ', err)
            }
          )
        })
      })
    }

    // 2. Request Notification Permission
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted.')
            subscribeUser()
          }
        })
      }
    }
  }, [subscribeUser])

  return null
}
