import { cache } from 'react'
import { createServerClient } from '@/lib/supabase/server'

export type ArrangementStil = 'moete' | 'tur'

type MalRad = { navn: string; type: ArrangementStil }

// Per-request cache av arrangementmaler. Samme funksjon kalles flere ganger
// i én rendring (agenda, detaljside, ICS) uten å spørre DB på nytt.
export const hentMaler = cache(async (): Promise<MalRad[]> => {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('arrangementmaler')
    .select('navn, type')

  if (error) throw new Error(`Kunne ikke hente arrangementmaler: ${error.message}`)

  // Filtrer ut maler uten type (skal ikke finnes etter migrasjon 046, men guard)
  return (data ?? [])
    .filter((m): m is MalRad => m.type === 'moete' || m.type === 'tur')
})

// Utleder skjema-stil fra malnavn. Kaster hvis malen ikke finnes — da er det
// en data-integritetsfeil som bør synliggjøres, ikke skjules.
export function stilFor(malNavn: string | null | undefined, maler: MalRad[]): ArrangementStil {
  if (!malNavn) {
    // Fallback for eldre data uten mal_navn — skal ikke skje etter migrasjon 044.
    return 'moete'
  }
  const mal = maler.find(m => m.navn === malNavn)
  if (!mal) {
    console.error(`[arrangement-stil] Ukjent mal: "${malNavn}". Fallback til moete.`)
    return 'moete'
  }
  return mal.type
}

// Scene-kategori brukt av Placeholder og gradient-bakgrunner. Tidligere duplisert
// i 3 komponenter (ArrangementKort, HighlightKort, page.tsx).
export function sceneFor(stil: ArrangementStil): 'tur' | 'møte' {
  return stil === 'tur' ? 'tur' : 'møte'
}

// Visningslabel brukt på Highlight-kort og tidligere-listen.
export function stilLabel(stil: ArrangementStil): string {
  return stil === 'tur' ? 'Tur' : 'Møte'
}
