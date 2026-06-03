'use client'

// Minimal toast: én melding av gangen, auto-fjerner seg etter `varighet` ms.
// Portal til document.body slik at sticky-headere / fixed-elementer ikke skjuler den.
// Bevisst enkel — vi har ikke behov for kø, varianter eller global state ennå.
// Hvis vi senere trenger toast flere steder, vurder Context-provider i (app)/layout.

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Toast({
  melding,
  varighet = 3000,
  onSkjul,
}: {
  melding: string | null
  varighet?: number
  onSkjul: () => void
}) {
  const [mounted, setMounted] = useState(false)

  // createPortal krever document — bare tilgjengelig etter mount på klient.
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!melding) return
    const t = setTimeout(onSkjul, varighet)
    return () => clearTimeout(t)
  }, [melding, varighet, onSkjul])

  if (!mounted || !melding) return null

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        // Over sticky-header (~50) og modaler (vi har ingen z=2000+ i dag)
        zIndex: 9999,
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent)',
        color: 'var(--text-primary)',
        padding: '10px 16px',
        borderRadius: 10,
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
        maxWidth: 'calc(100vw - 32px)',
        textAlign: 'center',
      }}
    >
      {melding}
    </div>,
    document.body,
  )
}
