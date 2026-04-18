'use client'

export default function SkjemaBar({
  tittel,
  onAvbryt,
  onLagre,
  lagreTekst = 'Lagre',
  lagrer = false,
}: {
  tittel: string
  onAvbryt: () => void
  onLagre: () => void
  lagreTekst?: string
  lagrer?: boolean
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 sticky top-0 z-30"
      style={{
        background: 'rgba(6, 6, 8, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '0.5px solid var(--border-subtle)',
      }}
    >
      <button
        type="button"
        onClick={onAvbryt}
        className="text-sm font-medium"
        style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        Avbryt
      </button>

      <span
        className="text-sm font-semibold"
        style={{ color: 'var(--text-primary)' }}
      >
        {tittel}
      </span>

      <button
        type="button"
        onClick={onLagre}
        disabled={lagrer}
        className="text-sm font-semibold px-4 py-1.5"
        style={{
          background: 'var(--accent)',
          color: '#000',
          borderRadius: 'var(--radius-pill)',
          border: 'none',
          cursor: lagrer ? 'not-allowed' : 'pointer',
          opacity: lagrer ? 0.5 : 1,
        }}
      >
        {lagrer ? '…' : lagreTekst}
      </button>
    </div>
  )
}
