import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon, PhoneIcon, EnvelopeIcon, CakeIcon } from '@heroicons/react/24/outline'
import Badge from '@/components/ui/Badge'
import { formaterDato } from '@/lib/dato'

export default async function MedlemProfil({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: medlem } = await supabase
    .from('profiles')
    .select('id, navn, visningsnavn, epost, telefon, rolle, fodselsdato, aktiv')
    .eq('id', id)
    .single()

  if (!medlem || !medlem.aktiv) notFound()

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/klubbinfo/medlemmer" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ChevronLeftIcon className="w-4 h-4" /> Medlemmer
        </Link>
      </div>

      <div className="rounded-2xl px-5 py-5" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          {medlem.navn}
          {medlem.rolle === 'admin' && (
            <span className="ml-2"><Badge variant="accent">admin</Badge></span>
          )}
        </h1>
        {medlem.visningsnavn && medlem.visningsnavn !== medlem.navn && (
          <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>«{medlem.visningsnavn}»</p>
        )}

        <div className="space-y-3 mt-4">
          {medlem.telefon && (
            <a href={`tel:${medlem.telefon}`} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              <PhoneIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              {medlem.telefon}
            </a>
          )}
          <a href={`mailto:${medlem.epost}`} className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <EnvelopeIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
            {medlem.epost}
          </a>
          {medlem.fodselsdato && (
            <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <CakeIcon className="w-4 h-4 shrink-0" style={{ color: 'var(--text-tertiary)' }} />
              {formaterDato(`${medlem.fodselsdato}T12:00:00Z`, 'd. MMMM yyyy')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
