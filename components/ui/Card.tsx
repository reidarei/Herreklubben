import { ReactNode } from 'react'

export default function Card({
  children,
  className = '',
  padding = true,
}: {
  children: ReactNode
  className?: string
  padding?: boolean
}) {
  return (
    <div
      className={`${padding ? 'p-5' : ''} ${className}`}
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
      }}
    >
      {children}
    </div>
  )
}
