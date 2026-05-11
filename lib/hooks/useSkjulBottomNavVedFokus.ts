import { useEffect } from 'react'

/**
 * Mountes ÉN gang globalt fra BottomNav. Lytter globalt etter focusin/focusout
 * på elementer med `data-chat-input="true"` og setter `data-chat-input-fokusert`
 * på <html> mens et slikt element har fokus. CSS i globals.css skjuler docken.
 *
 * Hookens kontrakt mot kall-stedet er triviell: alt UI som vil skjule docken
 * setter bare attributtet på input-elementet sitt — ingen import nødvendig.
 * Se CLAUDE.md → Policy: Bottom-nav-skjul.
 */
export function useSkjulBottomNavVedFokus() {
  useEffect(() => {
    const html = document.documentElement
    const ATTR = 'data-chat-input-fokusert'

    function erChatInput(target: EventTarget | null): boolean {
      return (
        target instanceof HTMLElement &&
        target.matches('[data-chat-input="true"]')
      )
    }

    function onFocusIn(e: FocusEvent) {
      if (erChatInput(e.target)) html.setAttribute(ATTR, '')
    }
    function onFocusOut(e: FocusEvent) {
      if (erChatInput(e.target)) html.removeAttribute(ATTR)
    }
    function onPageHide() {
      html.removeAttribute(ATTR)
    }

    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('pagehide', onPageHide)
      html.removeAttribute(ATTR) // ubetinget cleanup
    }
  }, [])
}
