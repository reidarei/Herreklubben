'use client'

import { useEffect } from 'react'
import { lesTemaFraStorage, resolveTema, settDataTheme, lyttPaaSystemEndring } from '@/lib/tema-klient'

// Montert av layout.tsx — binder localStorage og system-mq til data-theme
// etter hydration. Pre-hydration-scriptet i <head> gjør den første sync synkront;
// denne komponenten tar over og lytter på endringer (system-mq + CustomEvent fra UtseendeValg).
export default function TemaSync() {
  useEffect(() => {
    const valg = lesTemaFraStorage() ?? 'dark'
    settDataTheme(resolveTema(valg))

    let unsub: (() => void) | null = null
    if (valg === 'system') {
      unsub = lyttPaaSystemEndring((mode) => settDataTheme(mode))
    }

    // Lytt på tema-endring fra UtseendeValg-komponenten
    const handler = (e: Event) => {
      const v = (e as CustomEvent<string>).detail
      if (v === 'system') {
        if (!unsub) unsub = lyttPaaSystemEndring((mode) => settDataTheme(mode))
        settDataTheme(resolveTema('system'))
      } else {
        unsub?.(); unsub = null
        settDataTheme(v as 'dark' | 'light')
      }
    }
    window.addEventListener('temaEndret', handler)
    return () => { unsub?.(); window.removeEventListener('temaEndret', handler) }
  }, [])
  return null
}
