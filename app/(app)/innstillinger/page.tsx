import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfil } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import VarselToggle from '@/components/VarselToggle'
import IssuesListe from './IssuesListe'
import VarselLogg from './VarselLogg'
import ArrangementmalerAdmin from '@/components/ArrangementmalerAdmin'
import KaaringMalAdmin from '@/components/KaaringMalAdmin'
import InnstillingsKort from '@/components/innstillinger/InnstillingsKort'
import { kanAdministrere } from '@/lib/roller'

const innstillingLabels: Record<string, string> = {
  // Arrangementer
  nytt_arrangement: 'Nytt arrangement opprettet',
  oppdatert: '«Varsle nå»-knapp på arrangement',
  paaminnelse_7d: 'Påminnelse 7 dager før',
  paaminnelse_1d: 'Påminnelse dagen før',
  purring_aktiv: 'Purring til de som ikke har svart (3 d før)',
  arrangor_purring: 'Auto-purring til arrangøransvarlige',
  purring_ansvar: 'Manuell purring fra «purr»-knapp',
  // Poll og innlegg
  ny_poll: 'Ny avstemming',
  'melding-ny': 'Nytt innlegg på agenda',
  // Chat
  mention: '@-mention i chat',
  'privat-melding': 'Ny privatmelding',
  // Pass
  'pass-forespørsel': 'Forespørsel om pass-info (til generalsekretær)',
  'pass-godkjent': 'Pass-tilgang godkjent (til søker)',
  'pass-avslatt': 'Pass-tilgang avslått (til søker)',
  // Innspill
  ønske_ny: 'Nytt innspill (til admin)',
  ønske_lukket: 'Ditt innspill er håndtert',
  // Drift
  test_modus: 'Testmodus — varsler kun til Reidar',
}

// Foretrukket rekkefølge for visning. Noekler som ikke er i lista
// havner sist (alfabetisk).
const VARSEL_REKKEFOLGE = [
  'nytt_arrangement',
  'oppdatert',
  'paaminnelse_7d',
  'paaminnelse_1d',
  'purring_aktiv',
  'arrangor_purring',
  'purring_ansvar',
  'ny_poll',
  'melding-ny',
  'mention',
  'privat-melding',
  'pass-forespørsel',
  'pass-godkjent',
  'pass-avslatt',
  'ønske_ny',
  'ønske_lukket',
  'test_modus',
]

export default async function Innstillinger() {
  const [supabase, profil] = await Promise.all([createServerClient(), getProfil()])

  if (!kanAdministrere(profil?.rolle)) notFound()

  const admin = createAdminClient()
  const sisteDognIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [
    { data: logg, count: varselTotal },
    { count: pushCount },
    { data: innstillinger },
    { count: passVentende },
    { count: varselSisteDogn },
  ] = await Promise.all([
    admin
      .from('varsel_logg')
      .select('id, tittel, type, kanal, opprettet, profil_id, profiles (visningsnavn)', { count: 'exact' })
      .order('opprettet', { ascending: false })
      .limit(10),
    admin.from('push_subscriptions').select('id', { count: 'exact', head: true }),
    supabase
      .from('varsel_innstillinger')
      .select('noekkel, aktiv, beskrivelse')
      .order('noekkel'),
    admin
      .from('pass_tilgang_forespørsel')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'venter'),
    admin
      .from('varsel_logg')
      .select('id', { count: 'exact', head: true })
      .gte('opprettet', sisteDognIso),
  ])

  const { data: maler } = await admin
    .from('arrangementmaler')
    .select('*')
    .order('rekkefølge')
  const { data: kaaringmaler } = await admin
    .from('kaaringmaler')
    .select('id, navn, rekkefolge')
    .order('rekkefolge')

  return (
    <div style={{ padding: '0 20px 120px' }}>
      {/* Header */}
      <div
        style={{
          padding: '8px 4px 20px',
          marginBottom: 20,
          borderBottom: '0.5px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-tertiary)',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontWeight: 600,
          }}
        >
          <span style={{ width: 18, height: '0.5px', background: 'var(--border-strong)' }} />
          <Link
            href="/klubbinfo"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            Klubbinfo
          </Link>
          <span>/</span>
          <span>Innstillinger</span>
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 34,
            fontWeight: 400,
            color: 'var(--text-primary)',
            letterSpacing: '-0.8px',
            lineHeight: 0.98,
            margin: 0,
          }}
        >
          Innstillinger
        </h2>
      </div>

      {/* Admin-skille */}
      <div
        style={{
          marginBottom: 22,
          padding: '12px 14px',
          borderRadius: 12,
          border: '0.5px solid var(--border-strong)',
          background: 'var(--accent-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0a0a0a"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: 'var(--text-tertiary)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              fontWeight: 600,
              marginBottom: 1,
            }}
          >
            Kun for admin
          </div>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.2px',
              lineHeight: 1,
            }}
          >
            Administrasjon
          </div>
        </div>
      </div>

      {/* Push-varsler */}
      <InnstillingsKort
        tittel="Push-varsler"
        oppsummering={`${pushCount ?? 0} enhet${(pushCount ?? 0) !== 1 ? 'er' : ''} registrert`}
        alltidAapen
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--text-tertiary)',
            lineHeight: 1.45,
            margin: 0,
          }}
        >
          Antall enheter som har skrudd på push-varsler.
        </p>
      </InnstillingsKort>

      {/* Varsler-kontrollpanel */}
      {(() => {
        const sortert = [...(innstillinger ?? [])].sort((a, b) => {
          const ia = VARSEL_REKKEFOLGE.indexOf(a.noekkel)
          const ib = VARSEL_REKKEFOLGE.indexOf(b.noekkel)
          if (ia === -1 && ib === -1) return a.noekkel.localeCompare(b.noekkel)
          if (ia === -1) return 1
          if (ib === -1) return -1
          return ia - ib
        })
        const aktiveCount = sortert.filter(s => s.aktiv).length
        return (
          <InnstillingsKort
            tittel="Varsler — kontrollpanel"
            oppsummering={`${aktiveCount} av ${sortert.length} typer aktive`}
            beskrivelse="Hver type kan skrus av sentralt — påvirker alle medlemmer. Brukerens egne push/epost-innstillinger gjelder i tillegg."
          >
            <div>
              {sortert.map((inn, i, arr) => (
                <VarselToggle
                  key={inn.noekkel}
                  noekkel={inn.noekkel}
                  aktiv={inn.aktiv}
                  beskrivelse={innstillingLabels[inn.noekkel] ?? inn.beskrivelse ?? inn.noekkel}
                  last={i === arr.length - 1}
                />
              ))}
            </div>
          </InnstillingsKort>
        )
      })()}

      {/* Faste arrangementer */}
      <InnstillingsKort
        tittel="Faste arrangementer"
        oppsummering={`${maler?.length ?? 0} ${(maler?.length ?? 0) === 1 ? 'mal' : 'maler'}`}
      >
        <ArrangementmalerAdmin maler={maler ?? []} />
      </InnstillingsKort>

      {/* Kåringer */}
      <InnstillingsKort
        tittel="Kåringer"
        oppsummering={`${kaaringmaler?.length ?? 0} ${(kaaringmaler?.length ?? 0) === 1 ? 'mal' : 'maler'}`}
      >
        <KaaringMalAdmin maler={kaaringmaler ?? []} />
      </InnstillingsKort>

      {/* Pass-godkjenninger — egen lenke */}
      <Link
        href="/innstillinger/pass-godkjenninger"
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <InnstillingsKort
          tittel="Pass-godkjenninger →"
          oppsummering={
            (passVentende ?? 0) === 0
              ? 'Ingen ventende'
              : `${passVentende} ${passVentende === 1 ? 'venter' : 'venter'} på godkjenning`
          }
          badge={
            (passVentende ?? 0) > 0 ? (
              <span
                style={{
                  minWidth: 22,
                  height: 22,
                  padding: '0 8px',
                  borderRadius: 999,
                  background: 'var(--accent)',
                  color: '#0a0a0a',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {passVentende}
              </span>
            ) : null
          }
          alltidAapen
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--text-tertiary)',
              lineHeight: 1.45,
              margin: 0,
            }}
          >
            Trykk for å gjennomgå forespørsler om dagstilgang til passinfo.
          </p>
        </InnstillingsKort>
      </Link>

      {/* Ønsker fra brukerne */}
      <InnstillingsKort tittel="Ønsker fra brukerne">
        <IssuesListe />
      </InnstillingsKort>

      {/* Varselhistorikk */}
      <InnstillingsKort
        tittel="Varselhistorikk"
        oppsummering={
          `${varselTotal ?? 0} totalt · ${varselSisteDogn ?? 0} siste døgn`
        }
      >
        <VarselLogg initial={logg ?? []} total={varselTotal ?? 0} />
      </InnstillingsKort>

      {/* Web vitals */}
      <Link
        href="/innstillinger/vitals"
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        <InnstillingsKort
          tittel="Ytelse →"
          oppsummering="LCP, INP, CLS m.fl. per rute og enhet"
          alltidAapen
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 12,
              color: 'var(--text-tertiary)',
              lineHeight: 1.45,
              margin: 0,
            }}
          >
            Trykk for vitals fra ekte brukere — viser hvordan appen oppleves
            på mobil og desktop.
          </p>
        </InnstillingsKort>
      </Link>
    </div>
  )
}
