import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AlbumDetalj from '@/components/album/AlbumDetalj'

export default async function AlbumSide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [supabase] = await Promise.all([createServerClient(), getInnloggetBruker()])

  const { data: album } = await supabase
    .from('album')
    .select(
      `id, tittel, arrangement_id,
       arrangement:arrangementer (id, tittel),
       album_bilde!album_bilde_album_id_fkey (id, bilde_url, thumb_url, bredde, hoyde, opprettet, rekkefolge)`,
    )
    .eq('id', id)
    .single()

  if (!album) notFound()

  const arrangement = Array.isArray(album.arrangement) ? album.arrangement[0] : album.arrangement
  const bilder = ((album.album_bilde ?? []) as Array<{
    id: string
    bilde_url: string
    thumb_url: string | null
    bredde: number | null
    hoyde: number | null
    opprettet: string
    rekkefolge: number
  }>)
    .slice()
    .sort((a, b) => a.rekkefolge - b.rekkefolge || a.opprettet.localeCompare(b.opprettet))

  return (
    <div style={{ padding: '0 20px 120px' }}>
      <div style={{ paddingTop: 20, marginBottom: 16 }}>
        {arrangement && (
          <Link
            href={`/arrangementer/${arrangement.id}`}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-tertiary)',
              letterSpacing: '1.4px',
              fontWeight: 600,
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            ← {arrangement.tittel}
          </Link>
        )}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 28,
            fontWeight: 500,
            margin: '6px 0 0',
            color: 'var(--text-primary)',
            letterSpacing: '-0.4px',
          }}
        >
          {album.tittel}
        </h1>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-tertiary)',
            letterSpacing: '1.4px',
            fontWeight: 600,
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          {bilder.length} {bilder.length === 1 ? 'bilde' : 'bilder'}
        </div>
      </div>

      <AlbumDetalj bilder={bilder.map(b => ({
        id: b.id,
        bilde_url: b.bilde_url,
        thumb_url: b.thumb_url,
        bredde: b.bredde,
        hoyde: b.hoyde,
      }))} />
    </div>
  )
}
