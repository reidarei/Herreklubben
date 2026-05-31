'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistrering() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(console.error)

    // Lytt på messages fra SW. Push-klikk på iOS PWA havner her som
    // {type:'navigate', url} — SW kan ikke navigere appen direkte fordi
    // openWindow() er no-op når PWA-en allerede er åpen, og client.navigate()
    // er upålitelig på iOS. window.location.assign håndterer både full
    // navigasjon og hash-anker korrekt. Se #262.
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

    navigator.serviceWorker.addEventListener('message', handterMelding)
    return () => navigator.serviceWorker.removeEventListener('message', handterMelding)
  }, [])
  return null
}
