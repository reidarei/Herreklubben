import Image from 'next/image'

export default function Avatar({
  navn,
  bildeUrl,
  size = 40,
  className = '',
}: {
  navn: string
  bildeUrl?: string | null
  size?: number
  className?: string
}) {
  const initialer = navn
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const fontSize = size < 30 ? 10 : size < 50 ? 14 : 20

  if (bildeUrl) {
    return (
      <Image
        src={bildeUrl}
        alt={navn}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'var(--bg-elevated-2)',
        border: '1px solid var(--glass-border)',
        fontFamily: 'var(--font-display)',
        fontSize,
        color: 'var(--accent-muted)',
      }}
    >
      {initialer}
    </div>
  )
}
