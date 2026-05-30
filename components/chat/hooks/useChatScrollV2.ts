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

export function useChatScrollV2({
  containerRef,
  meldinger,
  brukerId,
  autoScrollTilBunn,
}: UseChatScrollV2Props): UseChatScrollV2Return {
  const bunnenRef = useRef<HTMLDivElement | null>(null)
  const [visNyMeldingPille, setVisNyMeldingPille] = useState(false)

  // Scroller containeren (ikke window) til absolutt bunn.
  const scrollTilBunn = useCallback((instant = false) => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({
      top: container.scrollHeight,
      behavior: instant ? 'auto' : 'smooth',
    })
  }, [containerRef])

  // Sjekker om containeren er innenfor CHAT_NAER_BUNN_TERSKEL_PX fra bunnen.
  function erNaerBunn() {
    const c = containerRef.current
    if (!c) return true
    return c.scrollHeight - c.scrollTop - c.clientHeight <= CHAT_NAER_BUNN_TERSKEL_PX
  }

  // Scroll-lytter på container: skjul pilla når brukeren manuelt scroller
  // til nær bunn. Passive for ytelse — vi gjør ingen preventDefault her.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    function onScroll() {
      if (erNaerBunn()) setVisNyMeldingPille(false)
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
    // containerRef.current kan endre seg, men ref-objektet er stabilt — ok
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])

  // Scroll ved mount og ved nye meldinger. Logikk speiler useChatScroll,
  // men opererer på container-scroll i stedet for window.
  // INGEN visualViewport — resizes-content håndterer tastaturet.
  const forrigeLengde = useRef(meldinger.length)
  const harMountet = useRef(false)
  useEffect(() => {
    const lengde = meldinger.length
    const diff = lengde - forrigeLengde.current
    forrigeLengde.current = lengde

    if (!harMountet.current) {
      harMountet.current = true
      if (autoScrollTilBunn) {
        // requestAnimationFrame så layout er ferdig før vi måler
        requestAnimationFrame(() => scrollTilBunn(true))
      }
      return
    }

    if (!autoScrollTilBunn) return
    if (diff <= 0 || diff > 3) return // paginering eller krympet liste — ikke scroll

    const sisteEgen = meldinger[meldinger.length - 1]?.profil_id === brukerId
    if (sisteEgen) {
      // Egen melding — vi forventer å se den vi sendte
      scrollTilBunn()
    } else if (erNaerBunn()) {
      // Annens melding, nær bunn — ikke avbryt lesingen av nylig innhold
      scrollTilBunn()
    } else {
      // Annens melding, brukeren er langt oppe — vis heller pilla
      setVisNyMeldingPille(true)
    }
    // meldinger og brukerId utelates bevisst — samme begrunnelse som i
    // useChatScroll: vi trigger kun på lengde, ikke hele array-referansen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meldinger.length, autoScrollTilBunn, scrollTilBunn])

  return { bunnenRef, visNyMeldingPille, scrollTilBunn }
}
