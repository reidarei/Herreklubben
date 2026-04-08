import { createServerClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'

export default async function TidligereArrangementer() {
  const supabase = await createServerClient()

  const { data: arrangementer } = await supabase
    .from('arrangementer')
    .select(`
      id, type, tittel, start_tidspunkt, oppmoetested,
      paameldinger (profil_id, status)
    `)
    .lt('start_tidspunkt', new Date().toISOString())
    .order('start_tidspunkt', { ascending: false })
    .limit(30)

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>← Tilbake</Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--tekst)' }}>Tidligere arrangementer</h1>
      </div>

      {!arrangementer || arrangementer.length === 0 ? (
        <p className="text-center py-12" style={{ color: 'var(--tekst-dempet)' }}>Ingen tidligere arrangementer.</p>
      ) : (
        <div className="space-y-3">
          {arrangementer.map(arr => {
            const antallJa = arr.paameldinger.filter((p: { status: string }) => p.status === 'ja').length
            const erTur = arr.type === 'tur'
            return (
              <Link
                key={arr.id}
                href={`/arrangementer/${arr.id}`}
                className="flex items-center gap-4 rounded-xl px-4 py-3 transition-colors"
                style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}
              >
                {/* Dato */}
                <div className="text-center shrink-0" style={{ minWidth: '36px' }}>
                  <div className="text-sm font-bold" style={{ color: 'var(--aksent)' }}>
                    {format(new Date(arr.start_tidspunkt), 'd', { locale: nb })}
                  </div>
                  <div className="text-xs uppercase" style={{ color: 'var(--tekst-dempet)' }}>
                    {format(new Date(arr.start_tidspunkt), 'MMM', { locale: nb })}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--tekst-dempet)' }}>
                    {format(new Date(arr.start_tidspunkt), 'yyyy', { locale: nb })}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: 'var(--tekst)' }}>{arr.tittel}</p>
                  {arr.oppmoetested && (
                    <p className="text-xs truncate" style={{ color: 'var(--tekst-dempet)' }}>{arr.oppmoetested}</p>
                  )}
                </div>

                {/* Etiketter */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{
                      background: erTur ? 'rgba(193,127,36,0.15)' : 'rgba(45,106,79,0.15)',
                      color: erTur ? 'var(--aksent-lys)' : 'var(--gronn-lys)',
                    }}>
                    {erTur ? 'Tur' : 'Møte'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--tekst-dempet)' }}>
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
