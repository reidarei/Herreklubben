export default function SectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex items-center gap-3 mb-3 ${className}`}>
      <span
        className="text-[11px] uppercase tracking-[0.08em] font-medium whitespace-nowrap"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-tertiary)',
        }}
      >
        {children}
      </span>
      <div
        className="flex-1 h-px"
        style={{ background: 'var(--border-subtle)' }}
      />
    </div>
  )
}
