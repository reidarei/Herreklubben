import { harGulGloed } from '@/lib/roller'

type Props = {
  name: string
  size?: number
  src?: string | null
  /** Medlemmets rolle — bestemmer evt. særegenskaper som gul glød. */
  rolle?: string | null
}

// Gul-oransje glød som markerer generalsekretæren rundt profilbildet.
// Bruker box-shadow lagvis (indre ring + mykt skjær) så effekten fungerer
// både på avatar-bildet og på initial-bakgrunnen.
const GULGLOED =
  '0 0 0 1px #e8d9b5, 0 0 8px 1px color-mix(in srgb, #e8d9b5 35%, transparent)'

function initialerAv(navn: string): string {
  return navn
    .split(' ')
    .map(p => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function hueAv(navn: string): number {
  let h = 0
  for (let i = 0; i < navn.length; i++) {
    h = (h * 31 + navn.charCodeAt(i)) & 0xffff
  }
  return (h % 60) + 40
}

export default function Avatar({ name, size = 32, src, rolle }: Props) {
  const init = initialerAv(name || '?')
  const hue = hueAv(name || '')
  const glod = harGulGloed(rolle)

  const felles = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: glod ? 'none' : '0.5px solid var(--border)',
    flexShrink: 0,
    boxShadow: glod ? GULGLOED : undefined,
  } as const

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        style={{ ...felles, objectFit: 'cover' }}
      />
    )
  }

  return (
    <div
      style={{
        ...felles,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, oklch(0.28 0.04 ${hue}), oklch(0.18 0.03 ${hue}))`,
        color: 'var(--text-primary)',
        fontSize: size * 0.36,
        fontWeight: 600,
        fontFamily: 'var(--font-body)',
      }}
      aria-label={name}
    >
      {init}
    </div>
  )
}
