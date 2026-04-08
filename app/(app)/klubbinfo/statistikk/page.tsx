import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { subMonths } from 'date-fns'

export default async function Statistikk() {
  const supabase = await createServerClient()

  const tolv_mnd_siden = subMonths(new Date(), 12).toISOString()

  // Alle arrangementer med påmeldinger
  const { data: arrangementer } = await supabase
    .from('arrangementer')
    .select('id, tittel, start_tidspunkt, opprettet_av, paameldinger (profil_id, status)')
    .lt('start_tidspunkt', new Date().toISOString())
    .order('start_tidspunkt', { ascending: false })

  // Alle aktive profiler
  const { data: profiler } = await supabase
    .from('profiles')
    .select('id, navn')
    .eq('aktiv', true)
    .order('navn')

  if (!arrangementer || !profiler) return null

  const totalt = arrangementer.length
  const siste12 = arrangementer.filter(a => a.start_tidspunkt >= tolv_mnd_siden)

  // Deltagelse per medlem
  type StatRad = { id: string; navn: string; totalt: number; siste12: number; arrangert: number }
  const stats: Record<string, StatRad> = {}
  for (const p of profiler) {
    stats[p.id] = { id: p.id, navn: p.navn, totalt: 0, siste12: 0, arrangert: 0 }
  }

  for (const arr of arrangementer) {
    const erSiste12 = arr.start_tidspunkt >= tolv_mnd_siden
    if (stats[arr.opprettet_av]) stats[arr.opprettet_av].arrangert++
    for (const p of arr.paameldinger) {
      if (p.status === 'ja' && stats[p.profil_id]) {
        stats[p.profil_id].totalt++
        if (erSiste12) stats[p.profil_id].siste12++
      }
    }
  }

  const sortert = Object.values(stats).sort((a, b) => b.totalt - a.totalt)

  // Antall per år
  const perAar: Record<number, number> = {}
  for (const arr of arrangementer) {
    const aar = new Date(arr.start_tidspunkt).getFullYear()
    perAar[aar] = (perAar[aar] ?? 0) + 1
  }
  const aarSortert = Object.entries(perAar).sort((a, b) => Number(b[0]) - Number(a[0]))

  return (
    <div className="max-w-lg mx-auto px-4 pt-10 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/klubbinfo" className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>← Tilbake</Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--tekst)' }}>Statistikk</h1>
      </div>

      {/* Nøkkeltall */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}>
          <p className="text-3xl font-bold" style={{ color: 'var(--aksent-lys)' }}>{totalt}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--tekst-dempet)' }}>Arrangementer totalt</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}>
          <p className="text-3xl font-bold" style={{ color: 'var(--aksent-lys)' }}>{siste12.length}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--tekst-dempet)' }}>Siste 12 måneder</p>
        </div>
      </div>

      {/* Deltagelse per medlem */}
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--aksent-lys)' }}>Deltagelse</h2>
      <div className="rounded-xl overflow-hidden mb-8" style={{ border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-4 px-4 py-2 text-xs font-semibold" style={{ background: 'var(--bakgrunn)', color: 'var(--tekst-dempet)' }}>
          <span className="col-span-2">Navn</span>
          <span className="text-right">Totalt</span>
          <span className="text-right">12 mnd</span>
        </div>
        {sortert.map((s, i) => (
          <div key={s.id} className="grid grid-cols-4 px-4 py-2.5 text-sm"
            style={{ background: i % 2 === 0 ? 'var(--bakgrunn-kort)' : 'var(--bakgrunn)', borderTop: '1px solid var(--border)' }}>
            <span className="col-span-2 font-medium" style={{ color: 'var(--tekst)' }}>{s.navn}</span>
            <span className="text-right font-bold" style={{ color: 'var(--aksent-lys)' }}>{s.totalt}</span>
            <span className="text-right" style={{ color: 'var(--tekst-dempet)' }}>{s.siste12}</span>
          </div>
        ))}
      </div>

      {/* Arrangert flest */}
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--aksent-lys)' }}>Flest arrangementer arrangert</h2>
      <div className="space-y-2 mb-8">
        {sortert.filter(s => s.arrangert > 0).sort((a, b) => b.arrangert - a.arrangert).slice(0, 5).map(s => (
          <div key={s.id} className="flex items-center justify-between rounded-xl px-4 py-2.5"
            style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--tekst)' }}>{s.navn}</span>
            <span className="text-sm font-bold" style={{ color: 'var(--aksent-lys)' }}>{s.arrangert}</span>
          </div>
        ))}
      </div>

      {/* Per år */}
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--aksent-lys)' }}>Arrangementer per år</h2>
      <div className="space-y-2">
        {aarSortert.map(([aar, antall]) => (
          <div key={aar} className="flex items-center gap-3 rounded-xl px-4 py-2.5"
            style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold w-12" style={{ color: 'var(--aksent)' }}>{aar}</span>
            <div className="flex-1 rounded-full overflow-hidden h-2" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{ background: 'var(--aksent)', width: `${Math.min((antall / 8) * 100, 100)}%` }} />
            </div>
            <span className="text-sm font-bold w-6 text-right" style={{ color: 'var(--tekst)' }}>{antall}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
