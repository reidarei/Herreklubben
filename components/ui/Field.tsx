import { ReactNode } from 'react'

export default function Field({
  label,
  children,
  icon,
}: {
  label: string
  children: ReactNode
  icon?: ReactNode
}) {
  return (
    <div
      className="flex items-center gap-3 py-3"
      style={{ borderBottom: '0.5px solid var(--border-subtle)' }}
    >
      {icon && (
        <div className="shrink-0 w-5 h-5" style={{ color: 'var(--text-tertiary)' }}>
          {icon}
        </div>
      )}
      <span
        className="text-[11px] uppercase tracking-[0.08em] font-medium shrink-0"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-tertiary)',
          minWidth: '70px',
        }}
      >
        {label}
      </span>
      <div className="flex-1 text-[15px] text-right" style={{ color: 'var(--text-primary)' }}>
        {children}
      </div>
    </div>
  )
}
