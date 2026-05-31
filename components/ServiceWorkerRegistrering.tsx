'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrering() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(console.error)

    // Push-klikk-navigasjon: SW kan ikke navigere appen selv (openWindow er
    // no-op når PWA-en allerede er åpen, client.navigate er upålitelig på
    // iOS — #233, #262). I stedet lagrer SW siste klikkede URL som
    // "pendingNav", og vi spør om den her ved mount og hver visibility-
    // change. iOS dropper postMessage som ankommer mens vinduet er frosset,
    // så pollingen er det robuste sporet — postMessage fra SW håndteres
    // også som "best effort". Se #264.
    function handterMelding(event: MessageEvent) {
      const data = event.data
      if (!data || data.type !== 'navigate' || typeof data.url !== 'string') return
      try {
        const url = new URL(data.url, window.location.origin)
        if (url.origin !== window.location.origin) return
        window.location.assign(url.href)
      } catch {
        // Ugyldig URL — ignorer.
      }
    }

    function sjekkPendingNav() {
      navigator.serviceWorker.controller?.postMessage({ type: 'check-pending-nav' })
    }

    function handterVisibility() {
      if (document.visibilityState === 'visible') sjekkPendingNav()
    }

    navigator.serviceWorker.addEventListener('message', handterMelding)
    document.addEventListener('visibilitychange', handterVisibility)
    // Sjekk ved mount også — dekker cold-start der PWA åpnes fra lukket.
    navigator.serviceWorker.ready.then(() => sjekkPendingNav())

    return () => {
      navigator.serviceWorker.removeEventListener('message', handterMelding)
      document.removeEventListener('visibilitychange', handterVisibility)
    }
  }, [])
  return null
}
