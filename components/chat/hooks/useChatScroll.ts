'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CHAT_NAER_BUNN_TERSKEL_PX } from '@/lib/konstanter'
import type { ChatMelding } from '../types'

type UseChatScrollProps = {
  meldinger: ChatMelding[]
  brukerId: string
  autoScrollTilBunn: boolean
}

type UseChatScrollReturn = {
  bunnenRef: React.RefObject<HTMLDivElement | null>
  keyboardOffset: number
}

export function useChatScroll({ meldinger, brukerId, autoScrollTilBunn }: UseChatScrollProps): UseChatScrollReturn {
  const bunnenRef = useRef<HTMLDivElement | null>(null)

  const scrollTilBunn = useCallback((instant = false) => {
    // window.scrollTo (ikke scrollIntoView) fordi vi vil ha hele siden
    // til bunnen, ikke kun bunnen av meldingsblokken. Sticky input-pill
    // under bunnenRef gir naturlig avstand.
    //
    // Initial-mount-scroll håndteres nå av <ChatAutoScrollScript /> i
    // sidens markup (kjører før hydrering, eliminerer flikket fra #209).
    // Denne useCallback brukes fortsatt for realtime-INSERT-grenen og som
    // defense-in-depth-fallback hvis inline-scriptet blokkeres.
    if (typeof window === 'undefined') return
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: instant ? 'auto' : 'smooth',
    })
  }, [])

  // Sjekker om brukeren befinner seg nær bunnen av siden.
  // Kjøres kun klient-side (window er undefined under SSR).
  function erNaerBunn(terskel = CHAT_NAER_BUNN_TERSKEL_PX) {
    if (typeof window === 'undefined') return true
    const rest = document.documentElement.scrollHeight - window.scrollY - window.innerHeight
    return rest <= terskel
  }

  // Scroll til bunn ved første mount (instant), og når nye meldinger
  // dukker opp i bunnen (smooth). Ikke ved paginering (store diff)
  // eller når listen krymper.
  const forrigeLengde = useRef(meldinger.length)
  const harMountet = useRef(false)
  useEffect(() => {
    const lengdeForDenneEffekten = meldinger.length
    const diff = lengdeForDenneEffekten - forrigeLengde.current
    forrigeLengde.current = lengdeForDenneEffekten

    if (!harMountet.current) {
      harMountet.current = true
      if (autoScrollTilBunn) {
        // requestAnimationFrame så DOM er rendret før vi måler/scroller
        requestAnimationFrame(() => scrollTilBunn(true))
      }
      return
    }
    if (autoScrollTilBunn && diff > 0 && diff <= 3) {
      const sisteEgen = meldinger[meldinger.length - 1]?.profil_id === brukerId
      // Egen melding: alltid scroll (forventet at vi ser det vi sendte).
      // Andres melding: scroll bare hvis brukeren står nær bunnen — ellers
      // er det irriterende å bli kastet ned mens han leser eldre. Se #238.
      if (sisteEgen || erNaerBunn()) scrollTilBunn()
    }
    // meldinger og brukerId utelates bevisst — vi trigger kun på lengde-endring
    // for å skille mellom ny-melding-scroll og paginering. Full array-avhengighet
    // ville gitt re-kjøring for reaksjonskjener etc. som ikke trenger scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meldinger.length, scrollTilBunn, autoScrollTilBunn])

  // Tastatur-høyde via visualViewport. Når iOS-tastaturet åpner med
  // interactiveWidget='overlays-content' (jf. app/layout.tsx, valgt for å
  // unngå dock-bug-klassen) endrer ikke window.innerHeight seg, men
  // visualViewport.height krymper. Differansen er omtrent tastatur-høyden.
  // keyboardOffset brukes KUN til layout: løfter input-pillen (sticky-pill
  // bottom) og vokser paddingBottom på meldingslisten. Ingen scroll-side-
  // effekter — terskel-basert auto-scroll fjernet fordi bounce-quirk (#222)
  // på iOS PWA var ikke robust å skille fra ekte tastatur-åpning. Se #236.
  const [keyboardOffset, setKeyboardOffset] = useState(0)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    const vv = window.visualViewport
    function oppdater() {
      const offset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardOffset(offset)
    }
    vv.addEventListener('resize', oppdater)
    vv.addEventListener('scroll', oppdater)
    oppdater()
    return () => {
      vv.removeEventListener('resize', oppdater)
      vv.removeEventListener('scroll', oppdater)
    }
  }, [])

  return { bunnenRef, keyboardOffset }
}
