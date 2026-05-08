'use client'

import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'

const AVVIST_NOKKEL = 'install-veiledning-avvist'

// Veileder for å installere PWA-en på iPhone via Safari (Del → Legg til på
// Hjem-skjerm). iOS Safari mangler en native «Install»-knapp som Chrome har
// på Android, så uten denne hint-en finner mange ikke installasjons-flyten.
//
// Vises kun når:
//   - Enheten er iOS (iPhone/iPad/iPod i UA)
//   - Appen kjører IKKE som installert PWA (navigator.standalone er false
//     på iOS Safari, eller matchMedia-display-mode er ikke 'standalone')
//   - Bruker har ikke avvist veiledningen tidligere (localStorage-flagg)
//
// Avvisning er permanent fra brukerens perspektiv — vi kan vurdere en
// re-show-policy senere hvis det viser seg at folk lukker uten å lese.
export default function InstallVeiledning() {
  const [synlig, setSynlig] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const erIos = /iPhone|iPad|iPod/.test(window.navigator.userAgent)
    if (!erIos) return

    // navigator.standalone er en iOS Safari-spesifikk prop som er true når
    // siden er åpnet fra hjem-skjerm. matchMedia-fallback dekker tilfeller
    // der nyere iOS skulle endre representasjonen.
    const navAny = window.navigator as Navigator & { standalone?: boolean }
    const erStandalone =
      navAny.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    if (erStandalone) return

    if (window.localStorage.getItem(AVVIST_NOKKEL) === '1') return

    // Kort delay så banneret ikke flasher inn før resten av siden er klar
    const timer = setTimeout(() => setSynlig(true), 600)
    return () => clearTimeout(timer)
  }, [])

  function avvis() {
    window.localStorage.setItem(AVVIST_NOKKEL, '1')
    setSynlig(false)
  }

  if (!synlig) return null

  return (
    <div
      role="dialog"
      aria-label="Installer på iPhone"
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 'max(96px, calc(env(safe-area-inset-bottom) + 84px))',
        zIndex: 9998,
        maxWidth: 456,
        margin: '0 auto',
        padding: '14px 14px 14px 16px',
        borderRadius: 'var(--radius)',
        background: 'var(--bg-elevated-2)',
        border: '0.5px solid var(--border-strong)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        backdropFilter: 'var(--blur-card)',
        animation: 'install-veiledning-inn 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
      }}
    >
      <style>{`
        @keyframes install-veiledning-inn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--accent)',
              letterSpacing: '1.6px',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Tips
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              color: 'var(--text-primary)',
              fontWeight: 500,
              lineHeight: 1.25,
              marginBottom: 8,
              letterSpacing: '-0.2px',
            }}
          >
            Installer Herreklubben på telefonen
          </div>
          <div
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            Trykk{' '}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ verticalAlign: '-2px' }}
              >
                <path d="M8 12V4l4-4 4 4v8M12 0v15M5 9h2m10 0h2M5 21h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
              </svg>
            </span>{' '}
            del-knappen i Safari og velg <strong style={{ color: 'var(--text-primary)' }}>Legg til på Hjem-skjerm</strong>. Da får du eget app-ikon og slipper nettleser-rammen rundt.
          </div>
        </div>
        <button
          type="button"
          onClick={avvis}
          aria-label="Lukk"
          style={{
            border: 'none',
            background: 'transparent',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon name="x" size={18} color="currentColor" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
