'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Defense-in-depth-fix for issue #99 (docken forsvinner etter swipe-back).
// Klassen `chat-input-fokus` settes på <html> av Chat.tsx når tastaturet er
// oppe i en chat-input. Hvis brukeren swiper tilbake mens klassen står på,
// kan timing-edge-cases gjøre at Chat-komponentens cleanup ikke rekker å
// rydde — og klassen forblir, noe som skjuler bottom-nav på neste side.
//
// Denne komponenten lytter på pathname og rydder klassen på hver
// navigasjon. Catch-all uavhengig av Chat-komponent-livssyklus.
export default function DockOpprydder() {
  const pathname = usePathname()
  useEffect(() => {
    document.documentElement.classList.remove('chat-input-fokus')
  }, [pathname])
  return null
}
