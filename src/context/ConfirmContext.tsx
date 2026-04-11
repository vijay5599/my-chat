'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import ConfirmationModal, { ConfirmType } from '@/components/ConfirmationModal'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmType
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  alert: (options: Omit<ConfirmOptions, 'cancelText'>) => Promise<void>
  setLoading: (isLoading: boolean) => void
  close: () => void
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState<ConfirmOptions & { isAlert?: boolean }>({
    title: '',
    message: '',
    type: 'info'
  })
  
  const resolver = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setConfig({ ...options, isAlert: false })
    setIsLoading(false)
    setIsOpen(true)
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  const alert = useCallback((options: Omit<ConfirmOptions, 'cancelText'>): Promise<void> => {
    setConfig({ ...options, isAlert: true, cancelText: '' })
    setIsLoading(false)
    setIsOpen(true)
    return new Promise((resolve) => {
      resolver.current = () => resolve()
    })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading)
  }, [])

  const handleConfirm = useCallback(() => {
    // We resolve the promise, but we DON'T close the modal here
    // This allows the caller to set loading state
    if (resolver.current) {
      resolver.current(true)
      // If it was an alert, we close immediately since there's no "loading" for alerts usually
      if (config.isAlert) {
        setIsOpen(false)
      }
    }
  }, [config.isAlert])

  const handleCancel = useCallback(() => {
    setIsOpen(false)
    setIsLoading(false)
    if (resolver.current) resolver.current(false)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setIsLoading(false)
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm, alert, setLoading, close }}>
      {children}
      <ConfirmationModal
        isOpen={isOpen}
        isLoading={isLoading}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.isAlert ? '' : config.cancelText}
        type={config.type}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return context
}
