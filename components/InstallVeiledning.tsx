'use client'

import { useEffect, useState } from 'react'
import Icon from '@/components/ui/Icon'

const AVVIST_NOKKEL = 'install-veiledning-avvist'

// beforeinstallprompt-eventet er en Chrome/Edge/Samsung Browser-ting (ikke
// i typingen for window-events ennå). Vi typer det inline.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Veileder for å installere PWA-en på telefonen.
//
//   - **iOS Safari** har ingen programmatisk install-API, så vi viser kun
//     instruksjoner: «Trykk del-knappen → Legg til på Hjem-skjerm».
//   - **Android Chrome / Edge / Samsung Browser** triggrer
//     `beforeinstallprompt` når kriteriene er møtt. Vi fanger eventet og
//     viser en faktisk Installer-knapp som kaller `prompt()`.
//   - **Andre nettlesere** (Firefox, eldre osv.) får ingen banner — vi
//     kan ikke hjelpe dem programmatisk og iOS-instruksjonene gir ikke
//     mening for dem.
//
// Skjules permanent etter avvisning eller vellykket installasjon
// (localStorage-flagg).
export default function InstallVeiledning() {
  const [iosBanner, setIosBanner] = useState(false)
  const [androidEvent, setAndroidEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.localStorage.getItem(AVVIST_NOKKEL) === '1') return

    // navigator.standalone er en iOS Safari-spesifikk prop som er true når
    // siden er åpnet fra hjem-skjerm. matchMedia-fallback dekker Android
    // og fremtidige iOS-endringer.
    const navAny = window.navigator as Navigator & { standalone?: boolean }
    const erStandalone =
      navAny.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    if (erStandalone) return

    // iOS-banner kun for iPhone/iPad/iPod
    const erIos = /iPhone|iPad|iPod/.test(window.navigator.userAgent)
    let iosTimer: ReturnType<typeof setTimeout> | null = null
    if (erIos) {
      iosTimer = setTimeout(() => setIosBanner(true), 600)
    }

    // Android (og Chrome desktop) — fang beforeinstallprompt og lagre eventet
    function handler(e: Event) {
      e.preventDefault()
      setAndroidEvent(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Hvis appen blir installert mens vi er åpen, fjern banneret og marker
    // som avvist så det ikke dukker opp igjen.
    function installerHandler() {
      window.localStorage.setItem(AVVIST_NOKKEL, '1')
      setIosBanner(false)
      setAndroidEvent(null)
    }
    window.addEventListener('appinstalled', installerHandler)

    return () => {
      if (iosTimer) clearTimeout(iosTimer)
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installerHandler)
    }
  }, [])

  function avvis() {
    window.localStorage.setItem(AVVIST_NOKKEL, '1')
    setIosBanner(false)
    setAndroidEvent(null)
  }

  async function installerAndroid() {
    if (!androidEvent) return
    await androidEvent.prompt()
    const valg = await androidEvent.userChoice
    if (valg.outcome === 'accepted') {
      // appinstalled-handleren tar resten — men vi kan trygt skjule banneret
      // her også for raskere visuell feedback.
      window.localStorage.setItem(AVVIST_NOKKEL, '1')
      setAndroidEvent(null)
    }
  }

  const synlig = iosBanner || !!androidEvent
  if (!synlig) return null

  return (
    <div
      role="dialog"
      aria-label="Installer på telefonen"
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
        <div style={{ flex: 1, minWidth: 0 }}>
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

          {iosBanner && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
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
              del-knappen i Safari og velg{' '}
              <strong style={{ color: 'var(--text-primary)' }}>Legg til på Hjem-skjerm</strong>.
              Da får du eget app-ikon og slipper nettleser-rammen rundt.
            </div>
          )}

          {androidEvent && (
            <>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                  marginBottom: 12,
                }}
              >
                Få eget app-ikon og slipp nettleser-rammen rundt.
              </div>
              <button
                type="button"
                onClick={installerAndroid}
                style={{
                  padding: '8px 16px',
                  borderRadius: 999,
                  border: 'none',
                  background: 'var(--accent)',
                  color: '#0a0a0a',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Installer
              </button>
            </>
          )}
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
