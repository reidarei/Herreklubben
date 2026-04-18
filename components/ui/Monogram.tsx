export default function Monogram({
  size = 80,
  className = '',
}: {
  size?: number
  className?: string
}) {
  const fontSize = size * 0.35

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle at 30% 30%, rgba(232, 217, 181, 0.15), rgba(232, 217, 181, 0.05))',
        border: '1px solid rgba(232, 217, 181, 0.12)',
        fontFamily: 'var(--font-display)',
        fontSize,
        color: 'var(--accent)',
        letterSpacing: '0.02em',
      }}
    >
      MH
    </div>
  )
}
