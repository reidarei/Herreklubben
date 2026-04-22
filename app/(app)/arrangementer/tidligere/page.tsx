import { createServerClient } from '@/lib/supabase/server'
import { formaterDato } from '@/lib/dato'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { hentMaler, stilFor } from '@/lib/arrangement-stil'

export default async function TidligereArrangementer() {
  const supabase = await createServerClient()

  const [{ data: arrangementer }, maler] = await Promise.all([
    supabase
      .from('arrangementer')
      .select(`
        id, mal_navn, tittel, start_tidspunkt, oppmoetested,
        paameldinger (profil_id, status)
      `)
      .lt('start_tidspunkt', new Date().toISOString())
      .order('start_tidspunkt', { ascending: false })
      .limit(30),
    hentMaler(),
  ])

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ChevronLeftIcon className="w-4 h-4" /> Tilbake
        </Link>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Tidligere arrangementer</h1>
      </div>

      {!arrangementer || arrangementer.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>Ingen tidligere arrangementer.</p>
      ) : (
        <div className="space-y-3">
          {arrangementer.map(arr => {
            const antallJa = arr.paameldinger.filter((p: { status: string }) => p.status === 'ja').length
            const erTur = stilFor(arr.mal_navn, maler) === 'tur'
            return (
              <Link
                key={arr.id}
                href={`/arrangementer/${arr.id}`}
                className="flex items-center gap-4 rounded-2xl px-4 py-3 transition-colors"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                {/* Dato */}
                <div className="text-center shrink-0" style={{ minWidth: '36px' }}>
                  <div className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                    {formaterDato(arr.start_tidspunkt, 'd')}
                  </div>
                  <div className="text-xs uppercase" style={{ color: 'var(--text-secondary)' }}>
                    {formaterDato(arr.start_tidspunkt, 'MMM')}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {formaterDato(arr.start_tidspunkt, 'yyyy')}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{arr.tittel}</p>
                  {arr.oppmoetested && (
                    <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{arr.oppmoetested}</p>
                  )}
                </div>

                {/* Etiketter */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: erTur ? 'var(--accent-subtle)' : 'var(--success-subtle)',
                      color: erTur ? 'var(--accent)' : 'var(--success)',
                    }}>
                    {erTur ? 'Tur' : 'Møte'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {antallJa} deltok
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
