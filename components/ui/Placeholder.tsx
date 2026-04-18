export default function Placeholder({
  height = 200,
  className = '',
}: {
  height?: number
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        height,
        borderRadius: 'var(--radius)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06))',
        border: '1px dashed var(--border)',
        color: 'var(--text-tertiary)',
        fontSize: 14,
      }}
    >
      Bilde
    </div>
  )
}
