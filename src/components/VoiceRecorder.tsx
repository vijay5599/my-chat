'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Trash2, Send } from 'lucide-react'

interface VoiceRecorderProps {
  onAudioReady: (blob: Blob) => void
  onCancel: () => void
}

export default function VoiceRecorder({ onAudioReady, onCancel }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [audioUrl])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error accessing microphone:', err)
      alert('Could not access microphone. Please check permissions.')
      onCancel()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSend = () => {
    if (audioBlob) {
      onAudioReady(audioBlob)
    }
  }

  const handleCancel = () => {
    if (isRecording) {
      stopRecording()
    }
    setAudioBlob(null)
    setAudioUrl(null)
    onCancel()
  }

  // Auto-start recording on mount
  useEffect(() => {
    startRecording()
    return () => stopRecording()
  }, [])

  return (
    <div className="flex items-center gap-3 bg-neutral-100 dark:bg-neutral-900 px-4 py-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm animate-in fade-in slide-in-from-bottom-2 w-full max-w-[500px]">
      {!audioUrl ? (
        <>
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-4 h-4 bg-red-500 rounded-full animate-ping opacity-20" />
              <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
            </div>
            <span className="text-sm font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">
              {formatDuration(duration)}
            </span>
            <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(239,68,68,0.5)]" 
                style={{ width: `${Math.min((duration / 60) * 100, 100)}%` }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCancel}
              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 rounded-full transition-colors"
              title="Cancel"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={stopRecording}
              className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all shadow-md active:scale-95"
              title="Stop Recording"
            >
              <Square size={18} fill="currentColor" />
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <audio src={audioUrl} controls className="w-full h-10 outline-none" />
          </div>
          <div className="flex gap-2 ml-2">
            <button 
              onClick={handleCancel}
              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 rounded-full transition-colors"
              title="Delete"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={handleSend}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all shadow-md active:scale-95"
              title="Send Voice Message"
            >
              <Send size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
