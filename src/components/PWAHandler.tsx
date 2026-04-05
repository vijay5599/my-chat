'use client'

import { useEffect } from 'react'

export default function PWAHandler() {
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
          }
        })
      }
    }
  }, [])


  return null
}
