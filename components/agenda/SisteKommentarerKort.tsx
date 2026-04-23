import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import SectionLabel from '@/components/ui/SectionLabel'
import { formatDistanceToNowStrict } from 'date-fns'
import { nb } from 'date-fns/locale'

export type KommentarSnippet = {
  id: string
  innhold: string
  opprettet: string
  avsender: {
    navn: string
    bilde_url: string | null
    rolle: string | null
  }
  kontekst: {
    type: 'arrangement' | 'poll'
    id: string
    tittel: string
  }
}

function snippet(tekst: string, maks = 70): string {
  const rensket = tekst.replace(/\s+/g, ' ').trim()
  if (rensket.length <= maks) return rensket
  return rensket.slice(0, maks - 1) + '…'
}

function relativTid(iso: string): string {
  return formatDistanceToNowStrict(new Date(iso), { locale: nb, addSuffix: true })
}

export default function SisteKommentarerKort({ items }: { items: KommentarSnippet[] }) {
  if (items.length === 0) return null

  return (
    <section style={{ marginBottom: 28 }}>
      <SectionLabel>Siste kommentarer</SectionLabel>
      <div>
        {items.map((k, i) => {
          const href =
            k.kontekst.type === 'arrangement'
              ? `/arrangementer/${k.kontekst.id}#kommentarer`
              : `/poll/${k.kontekst.id}#kommentarer`
          const erSiste = i === items.length - 1
          return (
            <Link
              key={k.id}
              href={href}
              style={{
                display: 'flex',
                gap: 10,
                padding: '10px 4px',
                borderBottom: erSiste ? 'none' : '0.5px solid var(--border-subtle)',
                textDecoration: 'none',
                color: 'inherit',
                alignItems: 'flex-start',
              }}
            >
              <Avatar
                name={k.avsender.navn}
                size={24}
                src={k.avsender.bilde_url}
                rolle={k.avsender.rolle}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 6,
                    marginBottom: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 12,
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                    }}
                  >
                    {k.avsender.navn}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      color: 'var(--text-tertiary)',
                      letterSpacing: '1px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {relativTid(k.opprettet)}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4,
                    marginBottom: 2,
                  }}
                >
                  {snippet(k.innhold)}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--text-tertiary)',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {k.kontekst.type === 'arrangement' ? '▸' : '◆'} {k.kontekst.tittel}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
