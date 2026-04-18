import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon, PhoneIcon, EnvelopeIcon, CakeIcon, TrophyIcon, CalendarDaysIcon } from '@heroicons/react/24/outline'
import Badge from '@/components/ui/Badge'
import { formaterDato } from '@/lib/dato'

export default async function MedlemProfil({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()

  const [{ data: medlem }, { data: kaaringer }, { data: arrangementer }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, navn, visningsnavn, epost, telefon, rolle, fodselsdato, aktiv')
      .eq('id', id)
      .single(),

    supabase
      .from('kaaring_vinnere')
      .select('id, aar, begrunnelse, kaaringmaler(navn)')
      .eq('profil_id', id)
      .order('aar', { ascending: false }),

    supabase
      .from('arrangementer')
      .select('id, tittel, type, start_tidspunkt')
      .eq('opprettet_av', id)
      .order('start_tidspunkt', { ascending: false }),
  ])

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

      {kaaringer && kaaringer.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
            <TrophyIcon className="w-4 h-4" />
            Kåringer
          </p>
          <div className="space-y-2">
            {kaaringer.map(k => (
              <div key={k.id} className="rounded-2xl px-5 py-3"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {k.kaaringmaler?.navn ?? 'Ukjent kåring'}
                  </p>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {k.aar}
                  </span>
                </div>
                {k.begrunnelse && (
                  <p className="text-xs mt-0.5 italic" style={{ color: 'var(--text-tertiary)' }}>
                    «{k.begrunnelse}»
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {arrangementer && arrangementer.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
            <CalendarDaysIcon className="w-4 h-4" />
            Arrangementer
          </p>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            {arrangementer.map((a, i) => (
              <Link
                key={a.id}
                href={`/arrangementer/${a.id}`}
                className="flex items-center justify-between px-5 py-3 text-sm"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  borderTop: i > 0 ? '0.5px solid var(--border)' : undefined,
                }}
              >
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {a.tittel}
                </span>
                <span className="text-xs shrink-0 ml-3" style={{ color: 'var(--text-tertiary)' }}>
                  {formaterDato(a.start_tidspunkt, 'MMM yyyy')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
