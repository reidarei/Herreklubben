'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendNyttArrangementVarsler, sendPaaminneVarsler, sendPurringVarsler } from '@/lib/varsler'
import { getProfil } from '@/lib/auth-cache'

export type ArrangementInput = {
  type: 'moete' | 'tur'
  tittel: string
  beskrivelse?: string
  start_tidspunkt: string
  oppmoetested?: string
  // Tur-felter
  slutt_tidspunkt?: string
  destinasjon?: string
  pris_per_person?: number
  sensurerte_felt?: Record<string, boolean>
  bilde_url?: string
  // Kobling til arrangøransvar
  ansvar_id?: string
}

export async function opprettArrangement(data: ArrangementInput) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Ikke innlogget')

  const { data: arrangement, error } = await supabase
    .from('arrangementer')
    .insert({
      type: data.type,
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

  // Koble til arrangøransvar hvis valgt
  if (data.ansvar_id) {
    await supabase
      .from('arrangoransvar')
      .update({ arrangement_id: arrangement.id })
      .eq('id', data.ansvar_id)
      .eq('ansvarlig_id', user.id)
  }

  revalidatePath('/')

  // Send varsler før redirect — after() er ikke pålitelig på Vercel Hobby
  await sendNyttArrangementVarsler({
    arrangementId: arrangement.id,
    tittel: arrangement.tittel,
    startTidspunkt: arrangement.start_tidspunkt,
    opprettetAv: user.id,
  }).catch(console.error)

  redirect(`/arrangementer/${arrangement.id}?varslet=true`)
}

export async function slettArrangement(id: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('arrangementer').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/')
  redirect('/')
}

export async function oppdaterArrangement(id: string, data: Partial<ArrangementInput>) {
  const supabase = await createServerClient()
  const { error } = await supabase
    .from('arrangementer')
    .update({
      ...data,
      oppdatert: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/arrangementer/${id}`)
  revalidatePath('/')
}

export async function varslOmArrangement(arrangementId: string) {
  const profil = await getProfil()
  if (profil?.rolle !== 'admin') throw new Error('Ikke admin')

  const supabase = await createServerClient()
  const { data: arrangement } = await supabase
    .from('arrangementer')
    .select('id, tittel, start_tidspunkt')
    .eq('id', arrangementId)
    .single()

  if (!arrangement) throw new Error('Arrangement ikke funnet')

  // Send varsler for alle tre typer
  await Promise.all([
    sendPaaminneVarsler({
      arrangementId: arrangement.id,
      tittel: arrangement.tittel,
      startTidspunkt: arrangement.start_tidspunkt,
      type: 'paaminne_7',
    }).catch(console.error),
    sendPaaminneVarsler({
      arrangementId: arrangement.id,
      tittel: arrangement.tittel,
      startTidspunkt: arrangement.start_tidspunkt,
      type: 'paaminne_1',
    }).catch(console.error),
    sendPurringVarsler({
      arrangementId: arrangement.id,
      tittel: arrangement.tittel,
      startTidspunkt: arrangement.start_tidspunkt,
    }).catch(console.error),
  ])

  revalidatePath(`/arrangementer/${arrangementId}`)
}
