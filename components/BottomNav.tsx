'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Icon, { type IkonNavn } from '@/components/ui/Icon'
import { useSkjulBottomNavVedFokus } from '@/lib/hooks/useSkjulBottomNavVedFokus'

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

  // Mount lytteren én gang globalt — BottomNav er mountet for hele app-layouten.
  // Dette eliminerer race-conditions ved multi-mount og betyr at alle elementer
  // med data-chat-input="true" automatisk skjuler docken ved fokus, uansett
  // hvilken komponent de bor i. Se CLAUDE.md → Policy: Bottom-nav-skjul.
  useSkjulBottomNavVedFokus()

  // Portal-mount-flagg. Dokken rendres via createPortal mot document.body
  // for å garantere at INGEN stamfar i React-treet kan etablere ny
  // "containing block" for position:fixed (transform/filter/backdrop-
  // filter/perspective/will-change/contain). Dette er defense-in-depth
  // mot regresjoner som #147 der dokken begynte å følge med scroll på iOS
  // selv om koden i BottomNav var uendret.
  //
  // SSR-strategi: Ved første render (server + før mount) rendres docken
  // inline der komponenten sitter i React-treet. Etter mount flyttes den
  // til document.body via portal. Dette unngår "tomrom" på første paint —
  // brukeren ser dock med en gang, og portal-flyttingen skjer usynlig
  // straks etter hydrering. Eventuell containing-block-bug fra en stamfar
  // vil kun gjelde i det korte vinduet før hydrering, hvor scroll uansett
  // ikke er aktivt.
  const [montert, setMontert] = useState(false)
  useEffect(() => {
    setMontert(true)
  }, [])

  // Dock-skjuling: hooken over setter `data-chat-input-fokusert` på <html>
  // når et element med data-chat-input="true" har fokus. CSS i globals.css
  // gjør selve skjulingen.
  const containerStyle: CSSProperties = {
    position: 'fixed',
    bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
    left: 0,
    right: 0,
    zIndex: 30,
    display: 'flex',
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

  const innhold = (
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

  // Server + første client-render: render inline. Etter mount: flytt til portal.
  if (!montert) return innhold
  return createPortal(innhold, document.body)
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
