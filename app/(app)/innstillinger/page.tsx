import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfil } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import SectionLabel from '@/components/ui/SectionLabel'
import VarselToggle from '@/components/VarselToggle'
import IssuesListe from './IssuesListe'
import VarselLogg from './VarselLogg'
import ArrangementmalerAdmin from '@/components/ArrangementmalerAdmin'
import KaaringMalAdmin from '@/components/KaaringMalAdmin'
import { kanAdministrere } from '@/lib/roller'

const innstillingLabels: Record<string, string> = {
  nytt_arrangement: 'Varsel ved nytt arrangement',
  paaminnelse_7d: 'Påminnelse 7 dager før',
  paaminnelse_1d: 'Påminnelse 1 dag før',
  purring_aktiv: 'Purring til de som ikke har svart (3 dager før)',
  arrangor_purring: 'Purring til arrangøransvarlige som ikke har opprettet arrangement',
  test_modus: 'Testmodus — varsler sendes kun til Reidar',
}

export default async function Innstillinger() {
  const [supabase, profil] = await Promise.all([createServerClient(), getProfil()])

  if (!kanAdministrere(profil?.rolle)) notFound()

  const admin = createAdminClient()
  const [
    { data: logg, count: varselTotal },
    { count: pushCount },
    { data: innstillinger },
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

      {/* Push-status */}
      <section style={{ marginBottom: 20 }}>
        <SectionLabel>Push-varsler</SectionLabel>
        <div
          style={{
            padding: '12px 4px',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-primary)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 18,
              color: 'var(--accent)',
              marginRight: 6,
            }}
          >
            {pushCount ?? 0}
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            enhet{(pushCount ?? 0) !== 1 ? 'er' : ''} registrert
          </span>
        </div>
      </section>

      {/* Varsler-togglere */}
      <section style={{ marginBottom: 24 }}>
        <SectionLabel>Varsler</SectionLabel>
        <div>
          {(innstillinger ?? []).map((inn, i, arr) => (
            <VarselToggle
              key={inn.noekkel}
              noekkel={inn.noekkel}
              aktiv={inn.aktiv}
              beskrivelse={innstillingLabels[inn.noekkel] ?? inn.beskrivelse ?? inn.noekkel}
              last={i === arr.length - 1}
            />
          ))}
        </div>
      </section>

      {/* Faste arrangementer */}
      <section style={{ marginBottom: 24 }}>
        <SectionLabel>Faste arrangementer</SectionLabel>
        <ArrangementmalerAdmin maler={maler ?? []} />
      </section>

      {/* Kåringer */}
      <section style={{ marginBottom: 24 }}>
        <SectionLabel>Kåringer</SectionLabel>
        <KaaringMalAdmin maler={kaaringmaler ?? []} />
      </section>

      {/* Ønsker fra brukerne */}
      <section style={{ marginBottom: 24 }}>
        <SectionLabel>Ønsker fra brukerne</SectionLabel>
        <IssuesListe />
      </section>

      {/* Varselhistorikk */}
      <section style={{ marginBottom: 24 }}>
        <SectionLabel>Varselhistorikk</SectionLabel>
        <VarselLogg initial={logg ?? []} total={varselTotal ?? 0} />
      </section>
    </div>
  )
}
