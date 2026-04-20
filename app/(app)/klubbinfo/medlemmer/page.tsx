import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import MedlemmerListe from './MedlemmerListe'
import { kanAdministrere } from '@/lib/roller'

type Deltagelse = {
  id: string
  navn: string
  totalt: number
  siste12: number
  arrangert: number
}

type Statistikk = {
  totalt: number
  siste12: number
  deltagelse: Deltagelse[] | null
  per_aar: unknown
}

export default async function Medlemmer() {
  const [supabase, profil] = await Promise.all([createServerClient(), getProfil()])
  const erAdmin = kanAdministrere(profil?.rolle)

  const [{ data: profiler }, { data: stat }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, navn, rolle, aktiv, bilde_url')
      .order('navn'),
    supabase.rpc('get_statistikk'),
  ])

  const statistikk = stat as unknown as Statistikk | null
  const totalHistoriske = statistikk?.totalt ?? 0
  const deltagelseMap = new Map<string, number>()
  for (const d of statistikk?.deltagelse ?? []) {
    deltagelseMap.set(d.id, d.totalt)
  }

  const medlemmer = (profiler ?? []).map(p => {
    const ja = deltagelseMap.get(p.id) ?? 0
    const narv =
      totalHistoriske > 0 ? Math.round((ja / totalHistoriske) * 100) : null
    return {
      id: p.id,
      navn: p.navn,
      rolle: p.rolle,
      narv,
      erAeres: false,
      aktiv: p.aktiv,
      bildeUrl: p.bilde_url,
    }
  })

  const antallAktive = medlemmer.filter(m => m.aktiv).length

  return (
    <div style={{ padding: '0 20px 120px' }}>
      {/* Header — editorial */}
      <div
        style={{
          padding: '12px 4px 28px',
          marginBottom: 8,
          borderBottom: '0.5px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: 'var(--text-tertiary)',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ width: 18, height: '0.5px', background: 'var(--border-strong)' }} />
          <Link
            href="/klubbinfo"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            Klubbinfo
          </Link>
          <span>/</span>
          <span>Medlemmer</span>
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 40,
            fontWeight: 400,
            color: 'var(--text-primary)',
            letterSpacing: '-1px',
            lineHeight: 0.98,
            margin: 0,
          }}
        >
          Herrene
        </h2>
        <div
          style={{
            marginTop: 10,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.1px',
          }}
        >
          {antallAktive} aktive · {totalHistoriske} sammenkomster
        </div>
      </div>

      <MedlemmerListe medlemmer={medlemmer} erAdmin={erAdmin} />

      {erAdmin && (
        <Link
          href="/klubbinfo/medlemmer/ny"
          style={{
            display: 'block',
            marginTop: 32,
            width: '100%',
            padding: '16px 0',
            borderRadius: 999,
            background: 'var(--accent)',
            color: '#0a0a0a',
            border: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: '0.2px',
            textAlign: 'center',
            textDecoration: 'none',
          }}
        >
          Inviter nytt medlem
        </Link>
      )}
    </div>
  )
}
