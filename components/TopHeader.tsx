'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type CSSProperties } from 'react'
import Avatar from '@/components/ui/Avatar'
import { harGulGloed } from '@/lib/roller'

type Tab = {
  href: string
  label: string
  nokkel: 'agenda' | 'chat' | 'klubb'
  /** Path-prefikser som markerer denne tab-en som aktiv. */
  prefikser: string[]
}

const TABS: Tab[] = [
  { href: '/', label: 'Agenda', nokkel: 'agenda', prefikser: ['/poll', '/arrangementer', '/meldinger'] },
  { href: '/chat', label: 'Chat', nokkel: 'chat', prefikser: ['/chat', '/samtaler'] },
  { href: '/klubbinfo', label: 'Klubb', nokkel: 'klubb', prefikser: ['/klubbinfo', '/kaaringer', '/album'] },
]

function erAktiv(tab: Tab, pathname: string): boolean {
  if (tab.href === '/') {
    if (pathname === '/') return true
    return tab.prefikser.some(p => pathname.startsWith(p))
  }
  return tab.prefikser.some(p => pathname.startsWith(p))
}

type Props = {
  brukerNavn?: string | null
  bildeUrl?: string | null
  rolle?: string | null
  /** True hvis det finnes uleste klubb-chat-meldinger fra andre. */
  ulestChat?: boolean
}

/**
 * Sticky topp-header med tre alltid-synlige tabs (Agenda / Chat / Klubb) og
 * profil-snarvei høyre. Aktiv tab markert med soft pill-bakgrunn. Path-prefikser
 * styrer hvilken tab som er aktiv på undersider (f.eks. `/arrangementer/123`
 * → Agenda aktiv).
 *
 * Erstattet bottom-nav for å eliminere bug-klassen vi traff i #99, #104, #147,
 * #151, #153 hvor iOS-tastatur kolliderte med fixed bottom-elementer. Se
 * Policy: Navigasjon i CLAUDE.md.
 */
export default function TopHeader({ brukerNavn, bildeUrl, rolle, ulestChat = false }: Props) {
  const pathname = usePathname()

  const headerStyle: CSSProperties = {
    position: 'sticky',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    paddingTop: 'env(safe-area-inset-top)',
    background: 'rgba(14, 15, 19, 0.85)',
    backdropFilter: 'var(--blur-nav)',
    WebkitBackdropFilter: 'var(--blur-nav)',
    borderBottom: '0.5px solid var(--border-subtle)',
  }

  const innerStyle: CSSProperties = {
    // Høyden speiles av --top-header-h i globals.css så andre sticky-elementer
    // (f.eks. VinnerBanner) kan stikke seg under headeren.
    height: 'var(--top-header-h, 60px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    gap: 8,
  }

  const profilAktiv = pathname === '/profil'
  // Generalsekretær har allerede gul ring rundt avataren — å legge på en
  // outline i tillegg gir to overlappende gule ringer. Drop outline her,
  // gloeden alene markerer at /profil er aktiv siden for ham.
  const visAktivOutline = profilAktiv && !harGulGloed(rolle ?? null)

  return (
    <nav style={headerStyle} aria-label="Hovednavigasjon">
      <div style={innerStyle}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {TABS.map(tab => {
            const aktiv = erAktiv(tab, pathname)
            // Prikken vises kun for Chat-taben, og aldri når taben er aktiv
            const visPrikk = tab.nokkel === 'chat' && ulestChat && !aktiv
            const tabStil: CSSProperties = {
              position: 'relative', // nødvendig for absolutt-posisjonert ulest-prikk
              padding: '8px 14px',
              borderRadius: 999,
              fontFamily: 'var(--font-body)',
              fontSize: 17,
              fontWeight: aktiv ? 600 : 400,
              color: aktiv ? 'var(--accent)' : 'var(--text-tertiary)',
              opacity: aktiv ? 1 : 0.6,
              background: aktiv ? 'var(--accent-soft)' : 'transparent',
              textDecoration: 'none',
              letterSpacing: '-0.3px',
              lineHeight: 1,
              transition: 'color 180ms ease, background-color 180ms ease, opacity 180ms ease',
            }
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={aktiv ? 'page' : undefined}
                style={tabStil}
                prefetch
              >
                {tab.label}
                {visPrikk && (
                  <>
                    {/* Visuell prikk */}
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 6,
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--accent)',
                        // Skygge i header-bg-fargen løfter prikken visuelt fra pill-bakgrunnen
                        boxShadow: '0 0 0 2px rgba(14, 15, 19, 0.85)',
                      }}
                    />
                    {/* Sr-only — behold "Chat" som accessible name, legg ulest-info
                        som ekstra tekst for skjermlesere uten å overstyre. */}
                    <span
                      style={{
                        position: 'absolute',
                        width: 1,
                        height: 1,
                        overflow: 'hidden',
                        clip: 'rect(0 0 0 0)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      (ulest)
                    </span>
                  </>
                )}
              </Link>
            )
          })}
        </div>

        {/* Profil-snarvei */}
        <Link
          href="/profil"
          aria-label="Min profil"
          aria-current={profilAktiv ? 'page' : undefined}
          style={{
            display: 'block',
            borderRadius: '50%',
            outline: visAktivOutline ? '1.5px solid var(--accent)' : 'none',
            outlineOffset: 2,
            flexShrink: 0,
          }}
        >
          <Avatar
            name={brukerNavn ?? 'Herreklubben'}
            src={bildeUrl ?? null}
            rolle={rolle ?? null}
            size={38}
          />
        </Link>
      </div>
    </nav>
  )
}
