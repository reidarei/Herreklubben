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
      className={`rounded-2xl ${padding ? 'p-5' : ''} ${className}`}
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
      }}
    >
      {children}
    </div>
  )
}
