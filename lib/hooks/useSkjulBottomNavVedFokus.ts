import { useEffect } from 'react'

/**
 * Brukes av Chat-komponenter for å skjule bottom-nav-docken mens en chat-input
 * har fokus. Lytter globalt etter focusin/focusout på elementer med
 * data-chat-input="true". Se CLAUDE.md → Policy: Bottom-nav-skjul.
 *
 * Kun Chat-komponenter har lov til å sette data-chat-input-fokusert.
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
