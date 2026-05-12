'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Icon, { type IkonNavn } from '@/components/ui/Icon'
import Avatar from '@/components/ui/Avatar'
import { harGulGloed } from '@/lib/roller'

type Tab = {
  href: string
  ikon: IkonNavn
  label: string
}

const TABS: Tab[] = [
  { href: '/', ikon: 'calendar', label: 'Agenda' },
  { href: '/chat', ikon: 'message', label: 'Chat' },
  { href: '/klubbinfo', ikon: 'building', label: 'Klubb' },
]

function erAktiv(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

type Props = {
  brukerNavn?: string | null
  bildeUrl?: string | null
  rolle?: string | null
}

/**
 * Sticky topp-header med hamburger til venstre og profil-snarvei til høyre.
 *
 * Når brukeren trykker hamburgeren morpher den til ×, og tre nav-knapper
 * (Agenda / Chat / Klubb) glir ut til høyre med en kort kaskade-animasjon.
 * Klikk utenfor, Escape, valg av tab eller pathname-endring lukker menyen.
 *
 * Erstattet tidligere fixed bottom-dock for å eliminere bug-klassen vi traff
 * i #99, #104, #147, #151, #153 hvor iOS-tastatur kolliderte med fixed
 * bottom-elementer. Se Policy: Navigasjon i CLAUDE.md.
 */
export default function TopHeader({ brukerNavn, bildeUrl, rolle }: Props) {
  const pathname = usePathname()
  const [apen, setApen] = useState(false)
  const hamburgerRef = useRef<HTMLButtonElement | null>(null)
  const forsteTabRef = useRef<HTMLAnchorElement | null>(null)

  // Lukk når ruten endrer seg (etter navigering)
  useEffect(() => {
    setApen(false)
  }, [pathname])

  // A11y: når menyen åpnes, flytt fokus til første nav-knapp. Ved Escape
  // setter vi fokus tilbake til hamburger-knappen så tastatur-brukere ikke
  // mister stedet sitt.
  useEffect(() => {
    if (apen) {
      // Liten timeout for å la animasjonen starte og elementene mountes
      const t = setTimeout(() => forsteTabRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [apen])

  // Click-outside + Escape — kun aktivt når menyen er åpen
  useEffect(() => {
    if (!apen) return
    function handleClick(e: Event) {
      const target = e.target as Node | null
      const root = document.getElementById('top-header-root')
      if (root && target && !root.contains(target)) {
        setApen(false)
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setApen(false)
        hamburgerRef.current?.focus()
      }
    }
    // pointerdown er én forent event på tvers av mus/touch/pen — unngår
    // double-toggle på iOS hvor både touchstart og mousedown ville fyrt.
    document.addEventListener('pointerdown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [apen])

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
    height: 'var(--top-header-h, 56px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
  }

  // 44 px touch-target (Apple HIG) med 38 px visuell skall inni.
  // Selve <button>-elementet er 44×44 og fanger hele klikkflaten — det indre
  // ikon-skallet er bare en pent rundet kapsel.
  const knappYtre: CSSProperties = {
    width: 44,
    height: 44,
    padding: 3,
    background: 'transparent',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    color: 'var(--text-primary)',
  }

  const knappInner: CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.06)',
    border: '0.5px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  }

  const profilAktiv = pathname === '/profil'
  // Generalsekretær har allerede gul ring rundt avataren — å legge på en
  // outline i tillegg gir to overlappende gule ringer. Drop outline her,
  // gloeden alene markerer at /profil er aktiv siden for ham.
  const visAktivOutline = profilAktiv && !harGulGloed(rolle ?? null)

  return (
    <header id="top-header-root" style={headerStyle} aria-label="Hovednavigasjon">
      <div style={innerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Hamburger / × */}
          <button
            ref={hamburgerRef}
            type="button"
            onClick={() => setApen(v => !v)}
            aria-label={apen ? 'Lukk meny' : 'Åpne meny'}
            aria-expanded={apen}
            style={knappYtre}
          >
            <span style={knappInner}>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: apen ? 0 : 1,
                  transition: 'opacity 180ms ease',
                }}
              >
                <Icon name="menu" size={18} strokeWidth={2} />
              </span>
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: apen ? 1 : 0,
                  transition: 'opacity 180ms ease',
                }}
              >
                <Icon name="x" size={18} strokeWidth={2} />
              </span>
            </span>
          </button>

          {/* Ekspanderte nav-knapper */}
          {apen &&
            TABS.map((tab, idx) => {
              const aktiv = erAktiv(tab.href, pathname)
              const stil: CSSProperties = {
                width: 40,
                height: 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: aktiv ? 'var(--accent-soft)' : 'rgba(255,255,255,0.06)',
                border: aktiv
                  ? '1.5px solid var(--accent)'
                  : '0.5px solid rgba(255,255,255,0.1)',
                boxShadow: aktiv ? '0 0 0 2px rgba(232,217,181,0.15)' : 'none',
                color: aktiv ? 'var(--accent)' : 'var(--text-primary)',
                textDecoration: 'none',
                flexShrink: 0,
                animation: `top-header-glid 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
                animationDelay: `${idx * 40}ms`,
                transformOrigin: 'left center',
              }
              return (
                <Link
                  key={tab.href}
                  ref={idx === 0 ? forsteTabRef : undefined}
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={aktiv ? 'page' : undefined}
                  style={stil}
                  prefetch
                >
                  <Icon
                    name={tab.ikon}
                    size={22}
                    strokeWidth={aktiv ? 1.8 : 1.5}
                    color="currentColor"
                  />
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
            // Gull-ring når på /profil-siden (skippes for generalsekretær —
            // han har allerede gul gloed rundt avataren).
            outline: visAktivOutline ? '1.5px solid var(--accent)' : 'none',
            outlineOffset: 2,
            flexShrink: 0,
          }}
        >
          <Avatar
            name={brukerNavn ?? 'Herreklubben'}
            src={bildeUrl ?? null}
            rolle={rolle ?? null}
            size={36}
          />
        </Link>
      </div>

      <style>{`
        @keyframes top-header-glid {
          from { opacity: 0; transform: translateX(-8px) scale(0.85); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </header>
  )
}
