import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'

type Props = {
  id: string
  navn: string
  rolle: string
  medlemSiden: number
  narv: number | null
  erNy?: boolean
  erAeres?: boolean
  last?: boolean
}

export default function MedlemRad({
  id,
  navn,
  rolle,
  medlemSiden,
  narv,
  erNy,
  erAeres,
  last,
}: Props) {
  const narvColor =
    narv == null
      ? 'var(--text-tertiary)'
      : narv >= 85
      ? 'var(--accent)'
      : narv >= 70
      ? 'var(--text-secondary)'
      : 'var(--text-tertiary)'

  return (
    <Link
      href={`/klubbinfo/medlemmer/${id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 4px',
        borderBottom: last ? 'none' : '0.5px solid var(--border-subtle)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <Avatar name={navn} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-0.2px',
              lineHeight: 1.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {navn}
          </span>
          {erNy && (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                color: 'var(--accent)',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                fontWeight: 600,
                padding: '2px 6px',
                border: '0.5px solid var(--border-strong)',
                borderRadius: 4,
                flexShrink: 0,
              }}
            >
              Ny
            </span>
          )}
          {erAeres && (
            <Icon name="crown" size={11} color="var(--accent)" strokeWidth={1.5} />
          )}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.1px',
          }}
        >
          {rolle} · medlem siden {medlemSiden}
        </div>
      </div>
      {narv != null && (
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              color: narvColor,
              letterSpacing: '0.3px',
              fontWeight: 500,
            }}
          >
            {narv}%
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              color: 'var(--text-tertiary)',
              letterSpacing: '1.3px',
              textTransform: 'uppercase',
              marginTop: 1,
            }}
          >
            Nærvær
          </div>
        </div>
      )}
    </Link>
  )
}
