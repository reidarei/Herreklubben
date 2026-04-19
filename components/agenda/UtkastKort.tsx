import Link from 'next/link'

export type UtkastData = {
  id: string
  tittel: string
  ansvarlig: string | null
}

export default function UtkastKort({ utkast }: { utkast: UtkastData }) {
  return (
    <Link
      href="/arrangoransvar"
      style={{
        display: 'flex',
        gap: 0,
        alignItems: 'stretch',
        overflow: 'hidden',
        borderRadius: 'var(--radius-card)',
        border: '1px dashed var(--border-strong)',
        background: 'transparent',
        textDecoration: 'none',
        color: 'inherit',
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
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: 'var(--text-tertiary)',
            letterSpacing: '1.6px',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Utkast
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--text-secondary)',
            letterSpacing: '-0.2px',
            margin: '0 0 6px',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {utkast.tittel}
        </h3>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: 'var(--text-tertiary)',
          }}
        >
          {utkast.ansvarlig ? (
            <>
              <span style={{ color: 'var(--text-secondary)' }}>{utkast.ansvarlig}</span>
              <span>skal arrangere</span>
            </>
          ) : (
            <span>Ingen ansvarlig ennå</span>
          )}
        </div>
      </div>

      <div
        style={{
          width: 108,
          flexShrink: 0,
          position: 'relative',
          borderLeft: '1px dashed var(--border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 54,
            fontWeight: 300,
            color: 'var(--text-tertiary)',
            letterSpacing: '-2px',
            lineHeight: 1,
            opacity: 0.55,
          }}
          aria-hidden="true"
        >
          ?
        </span>
      </div>
    </Link>
  )
}
