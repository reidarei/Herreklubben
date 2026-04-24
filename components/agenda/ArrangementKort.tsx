import Link from 'next/link'
import Image from 'next/image'
import Icon from '@/components/ui/Icon'
import Card from '@/components/ui/Card'
import KommentarerPaaKort, { type KommentarKortData } from '@/components/agenda/KommentarerPaaKort'
import { formaterDato } from '@/lib/dato'

export type ArrangementKortData = {
  id: string
  type: string // 'tur' | 'moete'
  tittel: string
  start_tidspunkt: string
  oppmoetested: string | null
  bilde_url?: string | null
  antallJa: number
  minStatus: 'ja' | 'kanskje' | 'nei' | null
}

function sceneFor(type: string): 'tur' | 'møte' | 'event' {
  if (type === 'tur') return 'tur'
  if (type === 'moete') return 'møte'
  return 'event'
}

function sceneBackground(scene: 'tur' | 'møte' | 'event'): string {
  if (scene === 'tur') {
    return `linear-gradient(180deg, var(--accent-soft) 0%, transparent 60%),
            linear-gradient(135deg, oklch(0.22 0.03 230), oklch(0.14 0.04 260))`
  }
  if (scene === 'møte') {
    return `linear-gradient(180deg, var(--accent-soft) 0%, transparent 60%),
            linear-gradient(135deg, oklch(0.20 0.02 40), oklch(0.12 0.02 30))`
  }
  return `linear-gradient(180deg, var(--accent-soft) 0%, transparent 60%),
          linear-gradient(135deg, oklch(0.20 0.03 200), oklch(0.13 0.03 220))`
}

function statusDotFarge(status: ArrangementKortData['minStatus']): string {
  if (status === 'ja') return 'var(--success)'
  if (status === 'kanskje') return 'var(--accent)'
  return 'var(--text-tertiary)'
}

function statusTekst(status: ArrangementKortData['minStatus']): string {
  if (status === 'ja') return 'Du er med'
  if (status === 'kanskje') return 'Du svarte kanskje'
  if (status === 'nei') return 'Du svarte nei'
  return 'Ikke svart'
}

type Props = {
  arr: ArrangementKortData
  tidligere?: boolean
  kommentarer?: KommentarKortData[]
}

export default function ArrangementKort({ arr, tidligere = false, kommentarer = [] }: Props) {
  const iso = arr.start_tidspunkt
  const mnd = formaterDato(iso, 'MMM').toUpperCase()
  const dag = formaterDato(iso, 'd')
  const tid = formaterDato(iso, 'HH:mm')
  const scene = sceneFor(arr.type)

  return (
    <Link
      href={`/arrangementer/${arr.id}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      <Card
        padding={false}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          opacity: tidligere ? 0.62 : 1,
          borderRadius: 'var(--radius-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: 0,
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
          {/* Dato-label */}
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
            <span>
              {dag}. {mnd}
            </span>
            <span style={{ color: 'var(--text-tertiary)', letterSpacing: '1.2px' }}>· {tid}</span>
          </div>

          {/* Tittel */}
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
            {arr.tittel}
          </h3>

          {/* Sted */}
          {arr.oppmoetested && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Icon name="mapPin" size={11} color="var(--text-tertiary)" />
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {arr.oppmoetested}
              </span>
            </div>
          )}

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
            {tidligere ? (
              <>
                <Icon name="checkmark" size={11} color="var(--text-tertiary)" strokeWidth={1.8} />
                <span>{arr.antallJa} deltok</span>
              </>
            ) : (
              <>
                <span
                  aria-hidden="true"
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: statusDotFarge(arr.minStatus),
                    flexShrink: 0,
                  }}
                />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {arr.antallJa} påmeldt · {statusTekst(arr.minStatus)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Thumb til høyre */}
        <div
          style={{
            width: 108,
            flexShrink: 0,
            position: 'relative',
            borderLeft: '0.5px solid var(--border-subtle)',
            background: arr.bilde_url ? undefined : sceneBackground(scene),
            overflow: 'hidden',
          }}
        >
          {arr.bilde_url ? (
            <Image
              src={arr.bilde_url}
              alt=""
              fill
              style={{ objectFit: 'cover' }}
              sizes="108px"
            />
          ) : (
            <svg
              width="100%"
              height="100%"
              style={{ position: 'absolute', inset: 0, opacity: 0.08 }}
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id={`thumb-stripes-${arr.id}`}
                  patternUnits="userSpaceOnUse"
                  width="8"
                  height="8"
                  patternTransform="rotate(45)"
                >
                  <rect width="4" height="8" fill="var(--accent)" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#thumb-stripes-${arr.id})`} />
            </svg>
          )}
        </div>
        </div>

        {/* Kommentarer — inne i kortet, kollapsbart, med inline input */}
        {!tidligere && (
          <KommentarerPaaKort
            kommentarer={kommentarer}
            scope={{ type: 'arrangement', id: arr.id }}
          />
        )}
      </Card>
    </Link>
  )
}
