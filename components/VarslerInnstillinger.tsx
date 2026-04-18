'use client'

import { useEffect, useState, useTransition } from 'react'
import Card from '@/components/ui/Card'
import SectionLabel from '@/components/ui/SectionLabel'
import ToggleSwitch from '@/components/ui/ToggleSwitch'

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
    <div className="mt-6">
      <SectionLabel>Varsler</SectionLabel>
      <Card>
        <div className="space-y-4 p-1">
          {/* E-post toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>E-postvarsler</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {epostAktiv ? 'Du får varsler på e-post' : 'E-postvarsler er av'}
              </p>
            </div>
            <ToggleSwitch
              checked={epostAktiv}
              onChange={toggleEpost}
              disabled={isPending}
            />
          </div>

          {/* Push toggle */}
          {pushStottet && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Push-varsler</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {pushStatus === 'laster' ? 'Sjekker...'
                    : pushStatus === 'avslatt' ? 'Blokkert i nettleseren'
                    : pushStatus === 'aktiv' ? 'Du får push-varsler på denne enheten'
                    : 'Push-varsler er av'}
                </p>
              </div>
              {pushStatus !== 'avslatt' && pushStatus !== 'laster' && (
                <ToggleSwitch
                  checked={pushStatus === 'aktiv'}
                  onChange={togglePush}
                />
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
