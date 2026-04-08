'use client'

import { useEffect, useState } from 'react'

type Status = 'laster' | 'aktiv' | 'inaktiv' | 'avslatt' | 'ikke-stottet'

export default function PushAbonnement() {
  const [status, setStatus] = useState<Status>('laster')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('ikke-stottet')
      return
    }
    if (Notification.permission === 'denied') {
      setStatus('avslatt')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setStatus(sub ? 'aktiv' : 'inaktiv')
    })
  }, [])

  async function aktiverVarsler() {
    const reg = await navigator.serviceWorker.ready
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') { setStatus('avslatt'); return }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    })

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    })
    setStatus('aktiv')
  }

  async function deaktiverVarsler() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    setStatus('inaktiv')
  }

  if (status === 'laster' || status === 'ikke-stottet') return null

  return (
    <div className="rounded-2xl p-4 mt-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Varsler</p>
      {status === 'avslatt' ? (
        <p className="text-xs" style={{ color: 'var(--destructive)' }}>
          Varsler er blokkert i nettleseren. Endre dette i nettleserinnstillingene.
        </p>
      ) : status === 'aktiv' ? (
        <>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Du får push-varsler om nye arrangementer og påminnelser.</p>
          <button onClick={deaktiverVarsler}
            className="text-xs py-2 px-4 rounded-xl"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
            Slå av varsler
          </button>
        </>
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>Slå på for å få varsler om nye arrangementer og påminnelser.</p>
          <button onClick={aktiverVarsler}
            className="text-xs py-2 px-4 rounded-xl font-semibold text-white"
            style={{ background: 'var(--accent)' }}>
            Slå på varsler
          </button>
        </>
      )}
    </div>
  )
}
