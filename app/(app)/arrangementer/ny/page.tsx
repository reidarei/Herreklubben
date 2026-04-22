import { createServerClient } from '@/lib/supabase/server'
import NyttArrangementSkjema from './NyttArrangementSkjema'
import { hentMalValg } from '@/lib/mal-valg'
import {
  ANNET_KEY,
  BONUS_MOETE_KEY,
  BONUS_TUR_KEY,
} from '@/components/arrangement/mal-valg-typer'

type Props = {
  searchParams: Promise<{ mal?: string; aar?: string }>
}

export default async function NyttArrangement({ searchParams }: Props) {
  const [supabase, sp] = await Promise.all([createServerClient(), searchParams])

  const valg = await hentMalValg(supabase)

  // Finn initialKey basert på query-param.
  // - ?mal=Bonusmøte/Bonustur → direkte Bonus-mal (fra "Annet"-dialog)
  // - ?mal=<konkret>&aar=<aar> → konkret ansvarskobling (fra utkast)
  // - ingen ?mal → bruker kom fra "Nytt"-knapp, dialog skal vise seg
  let initialKey: string = valg[0]?.key ?? ANNET_KEY
  let aapneDialogVedStart = false

  if (sp.mal === 'Bonusmøte') {
    initialKey = BONUS_MOETE_KEY
  } else if (sp.mal === 'Bonustur') {
    initialKey = BONUS_TUR_KEY
  } else if (sp.mal && sp.aar) {
    const kandidat = `${sp.mal}::${sp.aar}`
    if (valg.some(v => v.key === kandidat)) initialKey = kandidat
  } else if (!sp.mal) {
    // Ingen mal i URL → ventet at brukeren velger via dialog
    initialKey = ANNET_KEY
    aapneDialogVedStart = true
  }

  return (
    <NyttArrangementSkjema
      valg={valg}
      initialKey={initialKey}
      aapneDialogVedStart={aapneDialogVedStart}
    />
  )
}
