'use client'

import { useEffect, useState, useTransition } from 'react'

type PushStatus = 'laster' | 'aktiv' | 'inaktiv' | 'avslatt' | 'ikke-stottet'

export default function VarslerInnstillinger({
  pushAktiv: initialPushAktiv,
  epostAktiv: initialEpostAktiv,
}: {
  pushAktiv: boolean
  epostAktiv: boolean
}) {
  const [pushStatus, setPushStatus] = useState<PushStatus>('laster')
  const [epostAktiv, setEpostAktiv] = useState(initialEpostAktiv)
  const [pushAktiv, setPushAktiv] = useState(initialPushAktiv)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('ikke-stottet')
      return
    }
    if (Notification.permission === 'denied') {
      setPushStatus('avslatt')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription()
      setPushStatus(sub && pushAktiv ? 'aktiv' : 'inaktiv')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function oppdaterPreferanse(felt: 'push_aktiv' | 'epost_aktiv', verdi: boolean) {
    const res = await fetch('/api/varsel-preferanser', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [felt]: verdi }),
    })
    return res.ok
  }

  async function togglePush() {
    if (pushStatus === 'aktiv') {
      // Skru av push
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
      await oppdaterPreferanse('push_aktiv', false)
      setPushAktiv(false)
      setPushStatus('inaktiv')
    } else {
      // Skru på push
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setPushStatus('avslatt'); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      })
      await oppdaterPreferanse('push_aktiv', true)
      setPushAktiv(true)
      setPushStatus('aktiv')
    }
  }

  function toggleEpost() {
    const nyVerdi = !epostAktiv
    startTransition(async () => {
      const ok = await oppdaterPreferanse('epost_aktiv', nyVerdi)
      if (ok) setEpostAktiv(nyVerdi)
    })
  }

  const pushStottet = pushStatus !== 'ikke-stottet'

  return (
    <div className="rounded-2xl p-4 mt-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
      <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Varsler</p>

      <div className="space-y-3">
        {/* E-post toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>E-postvarsler</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {epostAktiv ? 'Du får varsler på e-post' : 'E-postvarsler er av'}
            </p>
          </div>
          <button
            onClick={toggleEpost}
            disabled={isPending}
            className="relative w-11 h-6 rounded-full transition-colors"
            style={{ background: epostAktiv ? 'var(--accent)' : 'var(--border)' }}
            aria-label={epostAktiv ? 'Slå av e-postvarsler' : 'Slå på e-postvarsler'}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
              style={{ transform: epostAktiv ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        {/* Push toggle */}
        {pushStottet && (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>Push-varsler</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {pushStatus === 'laster' ? 'Sjekker...'
                  : pushStatus === 'avslatt' ? 'Blokkert i nettleseren'
                  : pushStatus === 'aktiv' ? 'Du får push-varsler på denne enheten'
                  : 'Push-varsler er av'}
              </p>
            </div>
            {pushStatus !== 'avslatt' && pushStatus !== 'laster' && (
              <button
                onClick={togglePush}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: pushStatus === 'aktiv' ? 'var(--accent)' : 'var(--border)' }}
                aria-label={pushStatus === 'aktiv' ? 'Slå av push-varsler' : 'Slå på push-varsler'}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                  style={{ transform: pushStatus === 'aktiv' ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
