'use client'

import { useEffect } from 'react'

export default function PWAHandler() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Unregister all existing service workers for a clean state
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
  }, [])


  return null
}
