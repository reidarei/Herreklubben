import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { notFound, redirect } from 'next/navigation'
import RedigerSkjema from './RedigerSkjema'
import { kanAdministrere } from '@/lib/roller'
import { hentMalValg } from '@/lib/mal-valg'
import { ANNET_KEY, BONUS_MOETE_KEY, BONUS_TUR_KEY } from '@/components/arrangement/mal-valg-typer'

export default async function RedigerArrangement({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [supabase, user, profil] = await Promise.all([
    createServerClient(),
    getInnloggetBruker(),
    getProfil(),
  ])

  if (!user) redirect('/login')

  const { data: arr } = await supabase
    .from('arrangementer')
    .select('*')
    .eq('id', id)
    .single()

  if (!arr) notFound()

  const erAdmin = kanAdministrere(profil?.rolle)
  const kanRedigere = arr.opprettet_av === user.id || erAdmin

  if (!kanRedigere) redirect(`/arrangementer/${id}`)

  // Hent valg (inkluder gjeldende kobling) og finn initialKey
  const [valg, { data: gjeldendeAnsvar }] = await Promise.all([
    hentMalValg(supabase, id),
    supabase
      .from('arrangoransvar')
      .select('aar, arrangement_navn')
      .eq('arrangement_id', id)
      .limit(1)
      .maybeSingle(),
  ])

  // Finn initialKey basert på arrangementets mal. Bonus-maler er direkte
  // på arrangement (ingen arrangoransvar-rad). Konkrete maler utledes fra
  // arrangoransvar-kobling.
  let initialKey: string = ANNET_KEY
  if (arr.mal_navn === 'Bonusmøte') {
    initialKey = BONUS_MOETE_KEY
  } else if (arr.mal_navn === 'Bonustur') {
    initialKey = BONUS_TUR_KEY
  } else if (gjeldendeAnsvar?.arrangement_navn && gjeldendeAnsvar.aar != null) {
    const key = `${gjeldendeAnsvar.arrangement_navn}::${gjeldendeAnsvar.aar}`
    if (valg.some(v => v.key === key)) initialKey = key
  }

  return (
    <RedigerSkjema
      arrangement={{
        ...arr,
        sensurerte_felt: (arr.sensurerte_felt as Record<string, boolean> | null) ?? null,
      }}
      valg={valg}
      initialKey={initialKey}
    />
  )
}
