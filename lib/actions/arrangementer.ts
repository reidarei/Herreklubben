'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendNyttArrangementVarsler, sendOppdatertVarsler } from '@/lib/varsler'
import { getProfil } from '@/lib/auth-cache'
import { kanAdministrere } from '@/lib/roller'

export type ArrangementInput = {
  type: 'moete' | 'tur'
  mal_navn: string // 'Mai-juni møte' | 'Reisekomiteen' | 'Bonusmøte' | 'Bonustur' | ...
  tittel: string
  beskrivelse?: string | null
  start_tidspunkt: string
  oppmoetested?: string | null
  // Tur-felter. CHECK-constraint tur_felt_kun_for_tur krever at disse er null
  // når type='moete' — klienten må eksplisitt sende null, ikke tom streng.
  slutt_tidspunkt?: string | null
  destinasjon?: string | null
  pris_per_person?: number | null
  sensurerte_felt?: Record<string, boolean>
  bilde_url?: string | null
  // aar brukes til kobling til arrangoransvar (for konkrete maler som f.eks.
  // "Mai-juni møte" 2026). Bonus-maler har aar=null og ingen ansvars-kobling.
  aar?: number | null
}

async function koble(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  arrangementId: string,
  malNavn: string | null | undefined,
  aar: number | null | undefined,
) {
  // Bonus-maler har ingen arrangoransvar-rader (de er fritt-opprettede). Konkrete
  // maler (Mai-juni møte, Reisekomiteen, …) knyttes til ansvars-raden for (aar, malNavn).
  if (!malNavn || !aar || malNavn === 'Bonusmøte' || malNavn === 'Bonustur') return
  await supabase
    .from('arrangoransvar')
    .update({ arrangement_id: arrangementId })
    .eq('aar', aar)
    .eq('arrangement_navn', malNavn)
}

async function losne(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  arrangementId: string,
) {
  // Sett arrangement_id = null på alle rader som peker til dette arrangementet
  await supabase
    .from('arrangoransvar')
    .update({ arrangement_id: null })
    .eq('arrangement_id', arrangementId)
}

export async function opprettArrangement(data: ArrangementInput) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: arrangement, error } = await supabase
    .from('arrangementer')
    .insert({
      type: data.type,
      mal_navn: data.mal_navn,
      tittel: data.tittel,
      beskrivelse: data.beskrivelse || null,
      start_tidspunkt: data.start_tidspunkt,
      oppmoetested: data.oppmoetested || null,
      slutt_tidspunkt: data.slutt_tidspunkt || null,
      destinasjon: data.destinasjon || null,
      pris_per_person: data.pris_per_person || null,
      sensurerte_felt: data.sensurerte_felt || {},
      bilde_url: data.bilde_url || null,
      opprettet_av: user.id,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  await koble(supabase, arrangement.id, data.mal_navn, data.aar)

  revalidatePath('/')
  revalidatePath('/arrangoransvar')

  // Send varsler før redirect — after() er ikke pålitelig på Vercel Hobby
  await sendNyttArrangementVarsler({
    arrangementId: arrangement.id,
    tittel: arrangement.tittel,
    startTidspunkt: arrangement.start_tidspunkt,
  }).catch(console.error)

  redirect(`/arrangementer/${arrangement.id}?varslet=true`)
}

export async function slettArrangement(id: string) {
  const supabase = await createServerClient()
  // Løsne ansvar-rader før sletting slik at typen blir tilgjengelig igjen i
  // dropdown-en (FK har on delete set null, men vi gjør det eksplisitt først
  // for klarhet).
  await losne(supabase, id)
  const { error } = await supabase.from('arrangementer').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  revalidatePath('/arrangoransvar')
  redirect('/')
}

export async function oppdaterArrangement(id: string, data: Partial<ArrangementInput>) {
  const supabase = await createServerClient()

  // aar brukes kun til koble/losne — det er ikke en kolonne på arrangementer.
  const { aar, ...arrFelter } = data

  const { error } = await supabase
    .from('arrangementer')
    .update({
      ...arrFelter,
      oppdatert: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)

  // Mal-bytte: hvis mal_navn er eksplisitt satt, synkroniser arrangoransvar-koblingen.
  // Udefinert = rør ikke.
  if (arrFelter.mal_navn !== undefined) {
    await losne(supabase, id)
    await koble(supabase, id, arrFelter.mal_navn, aar)
  }

  revalidatePath(`/arrangementer/${id}`)
  revalidatePath('/')
  revalidatePath('/arrangoransvar')
}

export async function varslOmArrangement(arrangementId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: arrangement } = await supabase
    .from('arrangementer')
    .select('id, tittel, start_tidspunkt, opprettet_av')
    .eq('id', arrangementId)
    .single()

  if (!arrangement) throw new Error('Arrangement ikke funnet')

  // Sjekk at bruker er admin eller opprettet arrangementet
  const profil = await getProfil()
  const erAdmin = kanAdministrere(profil?.rolle)
  const erOpprettet = arrangement.opprettet_av === user.id
  if (!erAdmin && !erOpprettet) throw new Error('Ikke tilgang')

  // Send én oppdatert-varsling til alle
  await sendOppdatertVarsler({
    arrangementId: arrangement.id,
    tittel: arrangement.tittel,
    startTidspunkt: arrangement.start_tidspunkt,
  })

  revalidatePath(`/arrangementer/${arrangementId}`)
}
