'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Icon, { type IkonNavn } from '@/components/ui/Icon'

type Tab = {
  id: 'hjem' | 'klubbinfo' | 'chat' | 'profil'
  label: string
  href: string
  ikon: IkonNavn
}

const TABS: Tab[] = [
  { id: 'hjem', label: 'Agenda', href: '/', ikon: 'calendar' },
  { id: 'chat', label: 'Chat', href: '/chat', ikon: 'message' },
  { id: 'klubbinfo', label: 'Klubb', href: '/klubbinfo', ikon: 'building' },
  { id: 'profil', label: 'Profil', href: '/profil', ikon: 'user' },
]

function erAktiv(tab: Tab, pathname: string): boolean {
  if (tab.href === '/') return pathname === '/'
  return pathname.startsWith(tab.href)
}

function initialAv(navn?: string): string {
  if (!navn) return 'H'
  const bits = navn.trim().split(/\s+/)
  return (bits[0]?.[0] ?? 'H').toUpperCase()
}

type Props = {
  brukerNavn?: string | null
  bildeUrl?: string | null
}

export default function BottomNav({ brukerNavn, bildeUrl }: Props) {
  const pathname = usePathname()
  const initial = initialAv(brukerNavn ?? undefined)

  // Skjul dokken når tastaturet er åpent — ellers flyter den over
  // chat-input og skjemaer. BottomNav er den ENESTE sannhets-kilden for
  // dock-synlighet (issue #99): tidligere fantes en parallell mekanisme
  // i Chat.tsx + globals.css som kunne komme ut av synk og etterlate
  // docken skjult etter iOS swipe-back.
  //
  // Fem cleanup-lag for å overleve iOS-edge-cases:
  //   1. focusin/focusout på input/textarea — primær trigger
  //   2. visualViewport.resize — toveis sjekk basert på keyboard-høyde
  //   3. pagehide — fyrer ved iOS swipe-back før page unmount
  //   4. visibilitychange → hidden — når app går i bakgrunnen
  //   5. Reset ved pathname-endring + 300ms polling KUN når tastaturApent
  //      er true (slik at vi ikke vekker prosessoren unødvendig)
  const [tastaturApent, setTastaturApent] = useState(false)

  // Reset ved navigasjon — fanger tilfeller der focusout aldri fyrer
  useEffect(() => {
    setTastaturApent(false)
  }, [pathname])

  // Hovedeffekt: alle event-baserte signaler. Kjører hele tiden.
  useEffect(() => {
    function erTekstInput(el: EventTarget | null): boolean {
      if (!el || !(el instanceof HTMLElement)) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
    }
    function onFocusIn(e: FocusEvent) {
      if (erTekstInput(e.target)) setTastaturApent(true)
    }
    function onFocusOut(e: FocusEvent) {
      if (erTekstInput(e.target)) setTastaturApent(false)
    }
    document.addEventListener('focusin', onFocusIn)
    document.addEventListener('focusout', onFocusOut)

    const vv = window.visualViewport
    function onVv() {
      if (!vv) return
      // Enveis: kun setter til true når tastatur er detektert oppe.
      // False-tilstanden styres av focusout, pagehide, visibilitychange,
      // pathname-change og polling-fallback. Toveis VV var problematisk
      // fordi iOS Safari fyrer VV-resize-events under scroll (URL-bar-
      // kollaps, momentum, overscroll-bounce) — verdien kan kortvarig
      // krysse 150-terskelen og flippe state under scroll i chat (#104).
      if (window.innerHeight - vv.height > 150) setTastaturApent(true)
    }
    vv?.addEventListener('resize', onVv)

    function reset() {
      setTastaturApent(false)
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') reset()
    }
    window.addEventListener('pagehide', reset)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      document.removeEventListener('focusin', onFocusIn)
      document.removeEventListener('focusout', onFocusOut)
      vv?.removeEventListener('resize', onVv)
      window.removeEventListener('pagehide', reset)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // Polling-fallback: KUN aktiv når tastaturApent er true. Sjekker hver
  // 300ms om EN av to forutsetninger ikke holder lenger:
  //   (a) ingen tekst-input fokusert (catch-all for swipe-back uten focusout)
  //   (b) visualViewport sier at tastaturet faktisk er nede (catch-all
  //       for iOS «Done»-knapp som tar ned tastatur uten å blur'e input)
  // Krever ELLER-logikk: kun behold state hvis BÅDE input fokusert OG
  // tastatur oppe. Når tastaturApent = false er det ingen polling = ingen
  // batteribruk.
  useEffect(() => {
    if (!tastaturApent) return
    const id = setInterval(() => {
      const aktiv = document.activeElement
      const erInput =
        !!aktiv &&
        aktiv instanceof HTMLElement &&
        (aktiv.tagName === 'INPUT' ||
          aktiv.tagName === 'TEXTAREA' ||
          aktiv.isContentEditable)
      const vv = window.visualViewport
      const tastaturOppe = vv ? window.innerHeight - vv.height > 150 : true
      if (!erInput || !tastaturOppe) setTastaturApent(false)
    }, 300)
    return () => clearInterval(id)
  }, [tastaturApent])

  // display: 'none' når tastaturet er oppe — IKKE bare opacity:0.
  // Grunn: iOS Safari har en quirk der position:fixed-elementer kan ende
  // opp ankret til dokument-bunn (ikke viewport-bunn) når tastaturet er
  // oppe. Da blir docken synlig nederst i sideinnholdet (etter "Tidligere"
  // i agendaen), spesielt på chat-siden der man alltid scroller til bunns.
  // display:none fjerner elementet fra layout helt — det kan ikke ende opp
  // i feil posisjon hvis det ikke finnes (#104).
  const containerStyle: CSSProperties = {
    position: 'fixed',
    bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
    left: 0,
    right: 0,
    zIndex: 30,
    display: tastaturApent ? 'none' : 'flex',
    borderRadius: 999,
    padding: 6,
    background: `
      linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.05) 100%),
      var(--bg-elevated-2)
    `,
    backdropFilter: 'var(--blur-nav)',
    WebkitBackdropFilter: 'var(--blur-nav)',
    border: '0.5px solid rgba(255,255,255,0.12)',
    boxShadow: `
      0 12px 40px rgba(0,0,0,0.55),
      0 2px 10px rgba(0,0,0,0.3),
      inset 0 1px 0 rgba(255,255,255,0.14),
      inset 0 -1px 0 rgba(255,255,255,0.03),
      inset 0 0 20px rgba(255,255,255,0.02)
    `,
    overflow: 'hidden',
    width: 'calc(min(100%, 480px) - 32px)',
    marginInline: 'auto',
  }

  return (
    <nav className="fixed" style={containerStyle} aria-label="Hovednavigasjon">
      {/* Top glint overlay */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '45%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)',
          borderRadius: '999px 999px 50% 50%',
          pointerEvents: 'none',
          filter: 'blur(2px)',
        }}
      />
      {/* Chromatic sheen */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          background:
            'radial-gradient(ellipse 60% 100% at 30% 0%, var(--accent-soft) 0%, transparent 60%)',
          opacity: 0.4,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />

      {TABS.map((tab, idx) => {
        const aktiv = erAktiv(tab, pathname)
        const erProfil = tab.id === 'profil'
        const visSeparator = idx === TABS.length - 1

        const knappStyle: CSSProperties = {
          position: 'relative',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          padding: '8px 0 6px',
          border: 'none',
          borderRadius: 999,
          background: 'transparent',
          color: aktiv ? 'var(--accent)' : 'var(--text-tertiary)',
          fontFamily: 'var(--font-body)',
          fontSize: 10,
          fontWeight: 500,
          textDecoration: 'none',
          zIndex: 2,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }

        return (
          <NavElementer
            key={tab.id}
            visSeparator={visSeparator}
          >
            <Link href={tab.href} style={knappStyle} prefetch>
              {aktiv && <GlassBubble />}
              {erProfil ? (
                <ProfilDisk aktiv={aktiv} initial={initial} bildeUrl={bildeUrl} />
              ) : (
                <Icon
                  name={tab.ikon}
                  size={20}
                  color={aktiv ? 'var(--accent)' : 'var(--text-tertiary)'}
                  strokeWidth={aktiv ? 1.8 : 1.4}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
            </Link>
          </NavElementer>
        )
      })}
    </nav>
  )
}

function NavElementer({ children, visSeparator }: { children: ReactNode; visSeparator: boolean }) {
  return (
    <>
      {visSeparator && (
        <span
          aria-hidden="true"
          style={{
            width: '0.5px',
            margin: '10px 4px',
            background:
              'linear-gradient(180deg, transparent 0%, var(--border-strong) 50%, transparent 100%)',
            opacity: 0.6,
            flexShrink: 0,
          }}
        />
      )}
      {children}
    </>
  )
}

function GlassBubble() {
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 2,
          borderRadius: 999,
          background: `
            linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.12) 100%),
            var(--accent-soft)
          `,
          border: '0.5px solid rgba(255,255,255,0.22)',
          boxShadow: `
            inset 0 1px 0 rgba(255,255,255,0.35),
            inset 0 -1px 0 rgba(255,255,255,0.05),
            inset 0 0 12px rgba(255,255,255,0.06),
            0 2px 8px rgba(0,0,0,0.2)
          `,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: -1,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 3,
          left: '15%',
          right: '15%',
          height: 10,
          borderRadius: '999px 999px 50% 50%',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
          filter: 'blur(1.5px)',
          zIndex: -1,
        }}
      />
    </>
  )
}

function ProfilDisk({
  aktiv,
  initial,
  bildeUrl,
}: {
  aktiv: boolean
  initial: string
  bildeUrl?: string | null
}) {
  const felles: CSSProperties = {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: `1px solid ${aktiv ? 'var(--accent)' : 'var(--border-strong)'}`,
    boxShadow: aktiv
      ? '0 0 0 2px var(--accent-soft), inset 0 1px 0 rgba(255,255,255,0.2)'
      : 'inset 0 1px 0 rgba(255,255,255,0.08)',
    transition: 'all 0.25s',
    display: 'block',
  }

  if (bildeUrl) {
    // Rendres som 22 px — leverer en 44 px (2× DPR) optimalisert variant
    // via Vercel i stedet for full Supabase-URL (~125 KB ellers).
    return (
      <Image
        src={bildeUrl}
        alt=""
        width={22}
        height={22}
        sizes="44px"
        style={{ ...felles, objectFit: 'cover' }}
      />
    )
  }

  return (
    <span
      style={{
        ...felles,
        background: 'linear-gradient(135deg, var(--accent-soft), var(--bg-elevated))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontSize: 11,
        fontWeight: 500,
        color: aktiv ? 'var(--accent)' : 'var(--text-secondary)',
      }}
    >
      {initial}
    </span>
  )
}
