import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import VedtektVisning from './VedtektVisning'

export default async function VedtektSide({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const [supabase, profil] = await Promise.all([createServerClient(), getProfil()])
  const erAdmin = profil?.rolle === 'admin'

  const { data: vedtekt } = await supabase
    .from('vedtekter')
    .select('id, slug, tittel, innhold, oppdatert')
    .eq('slug', slug)
    .single()

  if (!vedtekt) notFound()

  const { data: versjoner } = await supabase
    .from('vedtekter_versjoner')
    .select('id, vedtaksdato, endringsnotat, opprettet, profiles (navn)')
    .eq('vedtekt_id', vedtekt.id)
    .order('opprettet', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/klubbinfo" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ChevronLeftIcon className="w-4 h-4" /> Tilbake
        </Link>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{vedtekt.tittel}</h1>
      </div>

      <VedtektVisning
        vedtekt={vedtekt}
        erAdmin={erAdmin}
        versjoner={versjoner ?? []}
      />
    </div>
  )
}
