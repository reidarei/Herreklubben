import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import Card from '@/components/ui/Card'
import { formaterDato } from '@/lib/dato'

export type PollKortData = {
  id: string
  spoersmaal: string
  svarfrist: string
  flervalg: boolean
  antallStemmer: number // antall unike profiler som har stemt
  harStemt: boolean
  avsluttet: boolean
}

type Props = {
  poll: PollKortData
  /** Plasser kortet i «tidligere»-stil (dempet opacity). */
  tidligere?: boolean
}

export default function PollKort({ poll, tidligere = false }: Props) {
  const iso = poll.svarfrist
  const mnd = formaterDato(iso, 'MMM').toUpperCase()
  const dag = formaterDato(iso, 'd')
  const tid = formaterDato(iso, 'HH:mm')

  return (
    <Link
      href={`/poll/${poll.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <Card
        padding={false}
        style={{
          display: 'flex',
          gap: 0,
          alignItems: 'stretch',
          opacity: tidligere ? 0.62 : 1,
          borderRadius: 'var(--radius-card)',
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '14px 14px 14px 16px',
          }}
        >
          {/* Label: «Avstemming» + frist */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--accent)',
              letterSpacing: '1.6px',
              fontWeight: 600,
              textTransform: 'uppercase',
            }}
          >
            <span>Avstemming</span>
            <span style={{ color: 'var(--text-tertiary)', letterSpacing: '1.2px' }}>
              · {poll.avsluttet ? 'avsluttet' : `frist ${dag}. ${mnd} ${tid}`}
            </span>
          </div>

          {/* Spørsmål */}
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.2px',
              margin: '0 0 6px',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {poll.spoersmaal}
          </h3>

          {/* Status-rad */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--text-tertiary)',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: poll.harStemt ? 'var(--success)' : 'var(--text-tertiary)',
              }}
            />
            <span>
              {poll.antallStemmer} stemt
              {!poll.avsluttet && ` · ${poll.harStemt ? 'Du har stemt' : 'Ikke stemt'}`}
            </span>
          </div>
        </div>

        {/* Grafisk indikator til høyre */}
        <div
          style={{
            width: 108,
            flexShrink: 0,
            position: 'relative',
            borderLeft: '0.5px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(180deg, var(--accent-soft) 0%, transparent 70%)`,
          }}
        >
          <Icon
            name="chart"
            size={34}
            color="var(--accent)"
            strokeWidth={1.4}
          />
        </div>
      </Card>
    </Link>
  )
}
