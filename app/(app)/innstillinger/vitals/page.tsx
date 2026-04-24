import { createAdminClient } from '@/lib/supabase/admin'
import { getProfil } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import { kanAdministrere } from '@/lib/roller'
import Link from 'next/link'
import SectionLabel from '@/components/ui/SectionLabel'

type VitalsRad = {
  rute: string
  metric: string
  verdi: number
  device_type: string | null
}

// Terskelverdiene web.dev bruker for Core Web Vitals (gode / akseptable)
const TERSKLER: Record<string, { god: number; akseptabel: number; enhet: string }> = {
  LCP:  { god: 2500, akseptabel: 4000, enhet: 'ms' },
  INP:  { god: 200,  akseptabel: 500,  enhet: 'ms' },
  CLS:  { god: 0.1,  akseptabel: 0.25, enhet: '' },
  FCP:  { god: 1800, akseptabel: 3000, enhet: 'ms' },
  TTFB: { god: 800,  akseptabel: 1800, enhet: 'ms' },
}

function percentil(verdier: number[], p: number): number {
  if (verdier.length === 0) return 0
  const sortert = [...verdier].sort((a, b) => a - b)
  const i = Math.min(Math.floor((sortert.length - 1) * p), sortert.length - 1)
  return sortert[i]
}

function fargeFor(metric: string, verdi: number): string {
  const t = TERSKLER[metric]
  if (!t) return 'var(--text-primary)'
  if (verdi <= t.god) return 'var(--success)'
  if (verdi <= t.akseptabel) return 'var(--accent)'
  return 'var(--danger)'
}

function formater(metric: string, verdi: number): string {
  const t = TERSKLER[metric]
  if (metric === 'CLS') return verdi.toFixed(3)
  return `${Math.round(verdi)} ${t?.enhet ?? ''}`
}

type Props = {
  searchParams: Promise<{ dager?: string; device?: string }>
}

export default async function VitalsAdmin({ searchParams }: Props) {
  const [profil, sp] = await Promise.all([getProfil(), searchParams])
  if (!kanAdministrere(profil?.rolle)) notFound()

  const dager = Math.min(parseInt(sp.dager ?? '7'), 90)
  const device = sp.device === 'mobile' || sp.device === 'desktop' ? sp.device : null

  const admin = createAdminClient()
  const fra = new Date(Date.now() - dager * 24 * 60 * 60 * 1000).toISOString()

  let q = admin
    .from('vitals_logg')
    .select('rute, metric, verdi, device_type')
    .gte('opprettet', fra)
    .limit(20_000)

  if (device) q = q.eq('device_type', device)

  const { data: rader } = await q

  // Grupper (rute, metric) → verdier
  const grupper = new Map<string, { rute: string; metric: string; verdier: number[] }>()
  for (const r of (rader ?? []) as VitalsRad[]) {
    const noekkel = `${r.rute}||${r.metric}`
    const g = grupper.get(noekkel) ?? { rute: r.rute, metric: r.metric, verdier: [] }
    g.verdier.push(r.verdi)
    grupper.set(noekkel, g)
  }

  // Sorter: metric stigende (LCP, INP osv), rute alfabetisk
  const METRIC_ORDER = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB']
  const rekker = [...grupper.values()].sort((a, b) => {
    const am = METRIC_ORDER.indexOf(a.metric)
    const bm = METRIC_ORDER.indexOf(b.metric)
    if (am !== bm) return am - bm
    return a.rute.localeCompare(b.rute)
  })

  const totalSamples = rader?.length ?? 0

  return (
    <div style={{ padding: '20px 20px 120px' }}>
      <header style={{ marginBottom: 18 }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-tertiary)',
          letterSpacing: '1.6px', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600,
        }}>
          Admin · Web vitals
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 500,
          letterSpacing: '-0.4px', margin: 0, color: 'var(--text-primary)',
        }}>
          Ytelsesmålinger
        </h1>
        <div style={{
          marginTop: 6, fontFamily: 'var(--font-body)', fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          {totalSamples} målinger siste {dager} dag(er)
          {device ? ` · ${device === 'mobile' ? 'mobil' : 'desktop'}` : ' · alle enheter'}
        </div>
      </header>

      {/* Filter-knapper */}
      <section style={{ marginBottom: 24 }}>
        <SectionLabel>Filter</SectionLabel>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {[1, 7, 30].map(d => (
            <FilterLenke key={d} aktiv={dager === d} href={`/innstillinger/vitals?dager=${d}${device ? `&device=${device}` : ''}`} label={`${d} d`} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <FilterLenke aktiv={device === null} href={`/innstillinger/vitals?dager=${dager}`} label="Alle enheter" />
          <FilterLenke aktiv={device === 'mobile'} href={`/innstillinger/vitals?dager=${dager}&device=mobile`} label="Mobil" />
          <FilterLenke aktiv={device === 'desktop'} href={`/innstillinger/vitals?dager=${dager}&device=desktop`} label="Desktop" />
        </div>
      </section>

      {/* Tabell per metric → rute */}
      {rekker.length === 0 ? (
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)',
          letterSpacing: '0.5px', margin: '16px 0',
        }}>
          Ingen målinger med nåværende filter.
        </p>
      ) : (
        <section>
          <SectionLabel>Rute × metric (p75 / p90)</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rekker.map(g => {
              const p75 = percentil(g.verdier, 0.75)
              const p90 = percentil(g.verdier, 0.9)
              return (
                <div
                  key={`${g.rute}||${g.metric}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 80px 80px 40px',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-elevated)',
                    border: '0.5px solid var(--border-subtle)',
                    fontFamily: 'var(--font-body)',
                    fontSize: 12,
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                    letterSpacing: '1.2px', color: 'var(--accent)',
                  }}>
                    {g.metric}
                  </span>
                  <span style={{
                    color: 'var(--text-secondary)', whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {g.rute}
                  </span>
                  <span style={{ color: fargeFor(g.metric, p75), fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>
                    p75 {formater(g.metric, p75)}
                  </span>
                  <span style={{ color: fargeFor(g.metric, p90), fontFamily: 'var(--font-mono)', fontSize: 11, textAlign: 'right' }}>
                    p90 {formater(g.metric, p90)}
                  </span>
                  <span style={{
                    color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: 10,
                    textAlign: 'right',
                  }}>
                    n={g.verdier.length}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function FilterLenke({ aktiv, href, label }: { aktiv: boolean; href: string; label: string }) {
  return (
    <Link
      href={href}
      style={{
        padding: '5px 12px',
        borderRadius: 999,
        border: `0.5px solid ${aktiv ? 'var(--accent)' : 'var(--border)'}`,
        background: aktiv ? 'var(--accent-soft)' : 'transparent',
        color: aktiv ? 'var(--accent)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: '1.2px',
        textTransform: 'uppercase',
        fontWeight: 600,
        textDecoration: 'none',
      }}
    >
      {label}
    </Link>
  )
}
