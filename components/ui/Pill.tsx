import { ReactNode } from 'react'

type Variant = 'default' | 'accent' | 'muted' | 'danger' | 'success'
type Size = 'default' | 'small'

const variantStyles: Record<Variant, React.CSSProperties> = {
  default: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'var(--text-primary)',
  },
  accent: {
    background: 'var(--accent-subtle)',
    color: 'var(--accent)',
  },
  muted: {
    background: 'rgba(255, 255, 255, 0.04)',
    color: 'var(--text-secondary)',
  },
  danger: {
    background: 'var(--danger-subtle)',
    color: 'var(--danger)',
  },
  success: {
    background: 'var(--success-subtle)',
    color: 'var(--success)',
  },
}

export default function Pill({
  children,
  variant = 'default',
  size = 'default',
  className = '',
}: {
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
}) {
  const sizeClass = size === 'small'
    ? 'text-[11px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1'

  return (
    <span
      className={`font-medium ${sizeClass} ${className}`}
      style={{
        ...variantStyles[variant],
        borderRadius: 'var(--radius-pill)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      {children}
    </span>
  )
}
