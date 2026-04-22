import { createServerClient } from '@/lib/supabase/server'
import NyttArrangementSkjema from './NyttArrangementSkjema'
import { hentMalValg } from '@/lib/mal-valg'

type Props = {
  searchParams: Promise<{ mal?: string; aar?: string }>
}

export default async function NyttArrangement({ searchParams }: Props) {
  const [supabase, sp] = await Promise.all([createServerClient(), searchParams])

  const valg = await hentMalValg(supabase)

  // Pre-velg basert på query-param (brukes av utkast-kort i agenda)
  let initialKey = valg[0]?.key ?? 'Annet::'
  if (sp.mal) {
    const kandidat =
      sp.mal === 'Annet'
        ? 'Annet::'
        : sp.aar
          ? `${sp.mal}::${sp.aar}`
          : null
    if (kandidat && valg.some(v => v.key === kandidat)) {
      initialKey = kandidat
    }
  }

  return <NyttArrangementSkjema valg={valg} initialKey={initialKey} />
}
