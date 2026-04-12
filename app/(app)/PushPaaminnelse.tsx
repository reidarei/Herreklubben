'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Status = 'laster' | 'vis' | 'skjul'

export default function PushPaaminnelse() {
  const [status, setStatus] = useState<Status>('laster')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('skjul')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('skjul')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'skjul' : 'vis')
    })
  }, [])

  async function aktiverPush() {
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setStatus('skjul'); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      setStatus('skjul')
    } catch {
      setStatus('skjul')
    }
  }

  if (status !== 'vis') return null

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6"
      style={{
        background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
        border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
      }}
    >
      <span style={{ fontSize: '18px' }}>🔔</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Skru på varsler så du ikke går glipp av noe
        </p>
      </div>
      <button
        onClick={aktiverPush}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0"
        style={{ background: 'var(--accent)', color: '#0a0a0a', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Aktiver
      </button>
    </div>
  )
}
