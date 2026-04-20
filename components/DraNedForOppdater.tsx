'use client'

// Dra-ned-for-oppdater for iOS PWA, hvor native pull-to-refresh er
// deaktivert i standalone-modus. Lytter på touch-events globalt og
// trigger router.refresh() når brukeren har dratt forbi terskelen.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const TERSKEL = 80
const MAX = 120

export default function DraNedForOppdater() {
  const [dra, setDra] = useState(0)
  const [laster, setLaster] = useState(false)
  const router = useRouter()
  const startY = useRef(0)
  const tracking = useRef(false)
  const draRef = useRef(0)

  useEffect(() => {
    function start(e: TouchEvent) {
      if (window.scrollY > 0) return
      startY.current = e.touches[0].clientY
      tracking.current = true
      draRef.current = 0
    }
    function move(e: TouchEvent) {
      if (!tracking.current) return
      if (window.scrollY > 0) {
        tracking.current = false
        setDra(0)
        return
      }
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0) return
      const v = Math.min(dy, MAX)
      draRef.current = v
      setDra(v)
    }
    function end() {
      if (!tracking.current) return
      tracking.current = false
      if (draRef.current >= TERSKEL) {
        setLaster(true)
        router.refresh()
        setTimeout(() => {
          setLaster(false)
          setDra(0)
        }, 900)
      } else {
        setDra(0)
      }
    }

    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', end, { passive: true })
    return () => {
      window.removeEventListener('touchstart', start)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
    }
  }, [router])

  const synlig = dra > 0 || laster
  const progress = Math.min(dra / TERSKEL, 1)
  const offset = Math.max(0, dra * 0.6 - 20)

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top)',
          left: '50%',
          transform: `translateX(-50%) translateY(${offset}px)`,
          transition: laster || dra > 0 ? 'none' : 'transform 200ms, opacity 200ms',
          opacity: synlig ? 1 : 0,
          zIndex: 100,
          pointerEvents: 'none',
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'var(--bg-elevated)',
          border: '0.5px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '1.5px solid transparent',
            borderTopColor: 'var(--accent)',
            borderRightColor: progress >= 1 || laster ? 'var(--accent)' : 'transparent',
            transform: laster ? undefined : `rotate(${progress * 270}deg)`,
            animation: laster ? 'dra-ned-spin 700ms linear infinite' : 'none',
          }}
        />
      </div>
      <style>{`@keyframes dra-ned-spin { to { transform: rotate(360deg) } }`}</style>
    </>
  )
}
