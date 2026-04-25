import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import Card from '@/components/ui/Card'
import KommentarerPaaKort, { type KommentarKortData } from '@/components/agenda/KommentarerPaaKort'
import MeldingReaksjoner, { type ReaksjonGruppe } from '@/components/agenda/MeldingReaksjoner'
import { formatDistanceToNowStrict } from 'date-fns'
import { nb } from 'date-fns/locale'

export type MeldingKortData = {
  id: string
  innhold: string
  opprettet: string
  sist_aktivitet: string
  forfatter: {
    id: string
    navn: string
    bilde_url: string | null
    rolle: string | null
  }
  reaksjoner: ReaksjonGruppe[]
  antallKommentarer: number
  /** Visuell dempning når kortet ligger i Tidligere-seksjonen */
  tidligere: boolean
}

function relativTid(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { locale: nb, addSuffix: true })
}

type Props = {
  melding: MeldingKortData
  /** Påloggede brukerens id — for å markere egne reaksjoner */
  brukerId: string
  kommentarer?: KommentarKortData[]
}

/**
 * Fjerde type element på agendaen — innlegg à la Facebook-status.
 * Plasseres øverst på agenda i 7 dager (eller så lenge det er aktivitet
 * de siste 2 dagene). Etter det faller den ned i Tidligere-seksjonen
 * sortert på sist_aktivitet. Se lib/agenda-sortering.ts for regelverket.
 */
export default function MeldingKort({ melding, brukerId, kommentarer = [] }: Props) {
  return (
    <Link
      href={`/meldinger/${melding.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <Card
        padding={false}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          opacity: melding.tidligere ? 0.62 : 1,
          borderRadius: 'var(--radius-card)',
        }}
      >
        <div style={{ padding: '14px 16px' }}>
          {/* Forfatter-rad */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
            }}
          >
            <Avatar
              name={melding.forfatter.navn}
              size={32}
              src={melding.forfatter.bilde_url}
              rolle={melding.forfatter.rolle}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                {melding.forfatter.navn}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginTop: 1,
                }}
              >
                {relativTid(melding.opprettet)}
              </div>
            </div>
          </div>

          {/* Innhold */}
          <div
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 15,
              color: 'var(--text-primary)',
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              marginBottom: melding.reaksjoner.length > 0 || !melding.tidligere ? 12 : 0,
            }}
          >
            {melding.innhold}
          </div>

          {/* Reaksjons-rad */}
          {!melding.tidligere && (
            <MeldingReaksjoner
              meldingId={melding.id}
              brukerId={brukerId}
              reaksjoner={melding.reaksjoner}
            />
          )}
        </div>

        {/* Kommentarer — kun på levende meldinger. Tidligere kortes ned
            til kun innholdet for å holde Tidligere-seksjonen ren. */}
        {!melding.tidligere && (
          <KommentarerPaaKort
            kommentarer={kommentarer}
            scope={{ type: 'melding', id: melding.id }}
          />
        )}
      </Card>
    </Link>
  )
}
