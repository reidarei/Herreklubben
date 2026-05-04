'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Defense-in-depth-fix for issue #99 (docken forsvinner etter swipe-back).
// Klassen `chat-input-fokus` settes på <html> av Chat.tsx når tastaturet er
// oppe i en chat-input. Hvis brukeren swiper tilbake mens klassen står på,
// kan timing-edge-cases gjøre at Chat-komponentens cleanup ikke rekker å
// rydde — og klassen forblir, noe som skjuler bottom-nav på neste side.
//
// To beskyttelseslag:
// 1. Pathname-watch fjerner klassen ved hver navigasjon
// 2. Periodisk sjekk (500ms) — hvis ingen chat-input faktisk er i fokus,
//    fjern klassen. Catch-all hvis iOS-events (pagehide/focusout/resize)
//    skipper en tick.
export default function DockOpprydder() {
  const pathname = usePathname()
  useEffect(() => {
    document.documentElement.classList.remove('chat-input-fokus')
  }, [pathname])

  useEffect(() => {
    const html = document.documentElement
    const id = setInterval(() => {
      if (!html.classList.contains('chat-input-fokus')) return
      const aktiv = document.activeElement as HTMLElement | null
      const erChatInput = !!aktiv && aktiv.dataset?.chatInput === 'true'
      if (!erChatInput) html.classList.remove('chat-input-fokus')
    }, 500)
    return () => clearInterval(id)
  }, [])
  return null
}
