import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

type StatRad = { id: string; navn: string; totalt: number; siste12: number; arrangert: number }
type StatistikkData = {
  totalt: number
  siste12: number
  deltagelse: StatRad[]
  per_aar: { aar: number; antall: number }[]
}

export default async function Statistikk() {
  const supabase = await createServerClient()

  const { data } = await supabase.rpc('get_statistikk')
  const stats = data as StatistikkData | null

  if (!stats) return null

  const sortert = stats.deltagelse ?? []
  const aarSortert = stats.per_aar ?? []

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/klubbinfo" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ChevronLeftIcon className="w-4 h-4" /> Tilbake
        </Link>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Statistikk</h1>
      </div>

      {/* Nøkkeltall */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{stats.totalt}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Arrangementer totalt</p>
        </div>
        <div className="rounded-2xl p-5 text-center" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{stats.siste12}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Siste 12 måneder</p>
        </div>
      </div>

      {/* Deltagelse per medlem */}
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--accent)' }}>Deltagelse</h2>
      <div className="rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid var(--border)' }}>
        <div className="grid grid-cols-4 px-5 py-2.5 text-xs font-semibold" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
          <span className="col-span-2">Navn</span>
          <span className="text-right">Totalt</span>
          <span className="text-right">12 mnd</span>
        </div>
        {sortert.map((s, i) => (
          <div key={s.id} className="grid grid-cols-4 px-5 py-2.5 text-sm"
            style={{ background: i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg)', borderTop: '1px solid var(--border-subtle)' }}>
            <span className="col-span-2 font-medium" style={{ color: 'var(--text-primary)' }}>{s.navn}</span>
            <span className="text-right font-bold" style={{ color: 'var(--accent)' }}>{s.totalt}</span>
            <span className="text-right" style={{ color: 'var(--text-secondary)' }}>{s.siste12}</span>
          </div>
        ))}
      </div>

      {/* Arrangert flest */}
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--accent)' }}>Flest arrangementer arrangert</h2>
      <div className="space-y-2 mb-8">
        {sortert.filter(s => s.arrangert > 0).sort((a, b) => b.arrangert - a.arrangert).slice(0, 5).map(s => (
          <div key={s.id} className="flex items-center justify-between rounded-2xl px-5 py-3"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.navn}</span>
            <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{s.arrangert}</span>
          </div>
        ))}
      </div>

      {/* Per år */}
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--accent)' }}>Arrangementer per år</h2>
      <div className="space-y-2">
        {aarSortert.map(({ aar, antall }) => (
          <div key={aar} className="flex items-center gap-3 rounded-2xl px-5 py-3"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold w-12" style={{ color: 'var(--accent)' }}>{aar}</span>
            <div className="flex-1 rounded-full overflow-hidden h-2" style={{ background: 'var(--border-subtle)' }}>
              <div className="h-full rounded-full" style={{ background: 'var(--accent)', width: `${Math.min((antall / 8) * 100, 100)}%` }} />
            </div>
            <span className="text-sm font-bold w-6 text-right" style={{ color: 'var(--text-primary)' }}>{antall}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
