'use client'

import { useRouter } from 'next/navigation'
import type { MouseEvent, KeyboardEvent, CSSProperties } from 'react'

/**
 * Inline «Kommenter»-knapp på agenda-kort. Rendres som span med role="button"
 * for å unngå invalid «button/a in anchor»-HTML (kortet selv er en Link).
 * preventDefault + stopPropagation hindrer at den ytre Link trigges.
 */
export default function KommenterKnapp({
  href,
  style,
}: {
  href: string
  style?: CSSProperties
}) {
  const router = useRouter()

  function naviger() {
    router.push(href)
  }

  function handleClick(e: MouseEvent<HTMLSpanElement>) {
    e.preventDefault()
    e.stopPropagation()
    naviger()
  }

  function handleKey(e: KeyboardEvent<HTMLSpanElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      naviger()
    }
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKey}
      aria-label="Kommenter"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 999,
        border: '0.5px solid var(--border)',
        background: 'transparent',
        color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: '1.4px',
        textTransform: 'uppercase',
        fontWeight: 600,
        cursor: 'pointer',
        ...style,
      }}
    >
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12a8 8 0 01-11 7l-6 2 2-5a8 8 0 1115-4z" />
      </svg>
      Kommenter
    </span>
  )
}
