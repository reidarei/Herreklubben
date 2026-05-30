'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { CHAT_NAER_BUNN_TERSKEL_PX } from '@/lib/konstanter'
import type { ChatMelding } from '../types'

type UseChatScrollV2Props = {
  /** Ref til scroll-containeren (den indre div med overflow-y: auto). */
  containerRef: React.RefObject<HTMLDivElement | null>
  meldinger: ChatMelding[]
  brukerId: string
  autoScrollTilBunn: boolean
}

type UseChatScrollV2Return = {
  /** Ref satt på en tom div nederst i meldingslisten. */
  bunnenRef: React.RefObject<HTMLDivElement | null>
  /** True når det finnes uleste meldinger fra andre og brukeren ikke er nær bunn. */
  visNyMeldingPille: boolean
  /** Scroller container til absolutt bunn (smooth). */
  scrollTilBunn: () => void
}

/**
 * Scroll-håndtering for ChatV2. Bevisst minimal: appen henter alle meldinger
 * ved initial-load (~300 meldinger i klubb-chatten), så vi har ingen
 * paginering, ingen IntersectionObserver, ingen scroll-anchor — det fjerner
 * hele bug-klassen vi har patchet flere ganger. Hooken har bare to oppgaver:
 *   1. Initial scroll til bunn ved mount
 *   2. Ved nye meldinger: pin til bunn hvis nær, ellers vis pille
 */
export function useChatScrollV2({
  containerRef,
  meldinger,
  brukerId,
  autoScrollTilBunn,
}: UseChatScrollV2Props): UseChatScrollV2Return {
  const bunnenRef = useRef<HTMLDivElement | null>(null)
  const [visNyMeldingPille, setVisNyMeldingPille] = useState(false)

  const scrollTilBunn = useCallback((instant = false) => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior: instant ? 'auto' : 'smooth',
    })
  }, [containerRef])

  function erNaerBunn() {
    const c = containerRef.current
    if (!c) return true
    return c.scrollHeight - c.scrollTop - c.clientHeight <= CHAT_NAER_BUNN_TERSKEL_PX
  }

  // Skjul pilla når brukeren manuelt scroller til nær bunn.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    function onScroll() {
      if (erNaerBunn()) setVisNyMeldingPille(false)
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])

  // Mount + nye meldinger
  const forrigeLengde = useRef(meldinger.length)
  const harMountet = useRef(false)
  useEffect(() => {
    const lengde = meldinger.length
    const diff = lengde - forrigeLengde.current
    forrigeLengde.current = lengde

    if (!harMountet.current) {
      harMountet.current = true
      if (autoScrollTilBunn) {
        requestAnimationFrame(() => scrollTilBunn(true))
      }
      return
    }

    if (!autoScrollTilBunn) return
    if (diff <= 0) return

    const sisteEgen = meldinger[meldinger.length - 1]?.profil_id === brukerId
    if (sisteEgen) {
      scrollTilBunn()
    } else if (erNaerBunn()) {
      scrollTilBunn()
    } else {
      setVisNyMeldingPille(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meldinger.length, autoScrollTilBunn, scrollTilBunn])

  return { bunnenRef, visNyMeldingPille, scrollTilBunn }
}
