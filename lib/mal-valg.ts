import type { createServerClient } from '@/lib/supabase/server'
import type { MalValg } from '@/components/arrangement/TypeVelger'
import { byggAnnetValg } from '@/components/arrangement/TypeVelger'

// Henter alle uoppfylte (aar, arrangement_navn)-kombinasjoner med tildelte
// ansvarlige, joiner med arrangementmaler for type + purredato, og returnerer
// en sortert liste klar for TypeVelger-dropdown. "Annet" legges alltid på
// slutten.
//
// includeArrangementId: hvis satt, inkluderes også rader som allerede er
// koblet til dette arrangementet. Brukes fra rediger-siden slik at den
// nåværende koblingen forblir valgbar.
export async function hentMalValg(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  includeArrangementId?: string,
): Promise<MalValg[]> {
  const ansvarQuery = supabase
    .from('arrangoransvar')
    .select('aar, arrangement_navn, ansvarlig:profiles!ansvarlig_id(navn)')

  const ansvarPromise = includeArrangementId
    ? ansvarQuery.or(`arrangement_id.is.null,arrangement_id.eq.${includeArrangementId}`)
    : ansvarQuery.is('arrangement_id', null)

  const [{ data: ansvar }, { data: maler }] = await Promise.all([
    ansvarPromise,
    supabase.from('arrangementmaler').select('navn, type, purredato'),
  ])

  const malMap = new Map<string, { type: 'moete' | 'tur' | null; purredato: string | null }>()
  for (const m of maler ?? []) {
    malMap.set(m.navn, {
      type: m.type as 'moete' | 'tur' | null,
      purredato: m.purredato,
    })
  }

  // Grupper på (aar, arrangement_navn) — samle ansvarlige navn
  type Grp = { aar: number; mal_navn: string; ansvarlige: string[] }
  const groups = new Map<string, Grp>()
  for (const a of ansvar ?? []) {
    if (a.aar == null || !a.arrangement_navn) continue
    const key = `${a.arrangement_navn}::${a.aar}`
    let g = groups.get(key)
    if (!g) {
      g = { aar: a.aar, mal_navn: a.arrangement_navn, ansvarlige: [] }
      groups.set(key, g)
    }
    // ansvarlig kan være null (hvis profilen er slettet) eller et objekt
    const ansv = a.ansvarlig as { navn: string | null } | null
    if (ansv?.navn) g.ansvarlige.push(ansv.navn)
  }

  // Filtrer bort grupper uten ansvarlige (skal være sjelden — rader uten
  // ansvarlig_id bør ikke eksistere, men guard for sikkerhets skyld)
  const gyldige = Array.from(groups.values()).filter(g => g.ansvarlige.length > 0)

  // Bygg MalValg
  const valg: MalValg[] = gyldige.map(g => {
    const mal = malMap.get(g.mal_navn)
    // Sett riktig år på purredato (mal-raden har år 2000 som sentinel)
    let purredato: string | null = null
    if (mal?.purredato) {
      const [, mnd, dag] = mal.purredato.split('-')
      purredato = `${g.aar}-${mnd}-${dag}`
    }
    return {
      key: `${g.mal_navn}::${g.aar}`,
      mal_navn: g.mal_navn,
      aar: g.aar,
      type: mal?.type ?? null,
      purredato,
      ansvarlige: g.ansvarlige,
    }
  })

  // Sortering: (aar asc, purredato asc nulls last)
  valg.sort((a, b) => {
    if (a.aar !== b.aar) return (a.aar ?? 0) - (b.aar ?? 0)
    if (a.purredato == null && b.purredato == null) return 0
    if (a.purredato == null) return 1
    if (b.purredato == null) return -1
    return a.purredato.localeCompare(b.purredato)
  })

  // "Annet" alltid til slutt
  valg.push(byggAnnetValg())
  return valg
}
