import Link from 'next/link'
import Icon from '@/components/ui/Icon'
import Monogram from '@/components/ui/Monogram'
import { formaterDato } from '@/lib/dato'

export type KlubbJubileumData = {
  id: string
  dato: string // YYYY-MM-DD for kommende stiftelsesdag
  alder: number
}

export default function KlubbJubileumKort({ jubileum }: { jubileum: KlubbJubileumData }) {
  const mnd = formaterDato(jubileum.dato, 'MMM').toUpperCase()
  const dag = formaterDato(jubileum.dato, 'd')

  return (
    <Link
      href="/klubbinfo"
      style={{
        display: 'flex',
        gap: 0,
        alignItems: 'stretch',
        overflow: 'hidden',
        borderRadius: 'var(--radius-card)',
        border: '0.5px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div
        style={{
          width: 56,
          flexShrink: 0,
          borderRight: '0.5px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="sparkle" size={24} color="var(--accent)" strokeWidth={1.25} />
      </div>

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-tertiary)',
            letterSpacing: '1.6px',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          <span>
            {dag}. {mnd}
          </span>
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--text-primary)',
            letterSpacing: '-0.2px',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          Herreklubben{' '}
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>
            fyller {jubileum.alder}
          </span>
        </h3>
      </div>

      <div
        style={{
          width: 108,
          flexShrink: 0,
          borderLeft: '0.5px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Monogram size={64} />
      </div>
    </Link>
  )
}
