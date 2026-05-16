'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type CSSProperties } from 'react'
import Avatar from '@/components/ui/Avatar'
import { harGulGloed } from '@/lib/roller'

type Tab = {
  href: string
  label: string
  /** Path-prefikser som markerer denne tab-en som aktiv. */
  prefikser: string[]
}

const TABS: Tab[] = [
  { href: '/', label: 'Agenda', prefikser: ['/poll', '/arrangementer', '/meldinger'] },
  { href: '/chat', label: 'Chat', prefikser: ['/chat', '/samtaler'] },
  { href: '/klubbinfo', label: 'Klubb', prefikser: ['/klubbinfo', '/kaaringer', '/album'] },
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
export default function TopHeader({ brukerNavn, bildeUrl, rolle }: Props) {
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
            const tabStil: CSSProperties = {
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
