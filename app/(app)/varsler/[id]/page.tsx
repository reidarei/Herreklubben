import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formaterDato } from '@/lib/dato'

export default async function VarselSide({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [supabase, user] = await Promise.all([createServerClient(), getInnloggetBruker()])

  const { data: varsel } = await supabase
    .from('varsel_logg')
    .select('id, tittel, melding, lest, opprettet, url')
    .eq('id', id)
    .eq('profil_id', user!.id)
    .single()

  if (!varsel) notFound()

  // Marker som lest
  if (!varsel.lest) {
    await supabase.from('varsel_logg').update({ lest: true }).eq('id', id)
  }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <Link
        href="/"
        className="text-sm mb-6 inline-block"
        style={{ color: 'var(--accent)', textDecoration: 'none' }}
      >
        ← Tilbake
      </Link>

      <div
        className="rounded-2xl p-5"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: '20px' }}>✅</span>
          <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
            {varsel.tittel}
          </h1>
        </div>

        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
          {varsel.melding}
        </p>

        {varsel.url && (
          <Link
            href={varsel.url}
            className="inline-block text-sm px-4 py-2 rounded-xl mb-4"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Gå til saken
          </Link>
        )}

        {varsel.opprettet && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            {formaterDato(varsel.opprettet, "d. MMMM yyyy 'kl.' HH:mm")}
          </p>
        )}
      </div>
    </div>
  )
}
