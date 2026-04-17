import { addDays } from 'date-fns'
import { norskDatoNaa } from '@/lib/dato'
import { sendPaaminneVarsler, sendPurringVarsler, sendArrangorPurringVarsler } from '@/lib/varsler'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

type Admin = SupabaseClient<Database>
type Arrangement = { id: string; tittel: string; start_tidspunkt: string }

function dagStreng(dato: Date): string {
  return dato.toISOString().slice(0, 10)
}

async function hentForDag(admin: Admin, dag: string) {
  const { data } = await admin
    .from('arrangementer')
    .select('id, tittel, start_tidspunkt')
    .gte('start_tidspunkt', `${dag}T00:00:00`)
    .lt('start_tidspunkt', `${dag}T23:59:59`)
  return data ?? []
}

async function hentArrangorPurringer(admin: Admin, dag: string) {
  const { data } = await admin
    .from('arrangoransvar')
    .select('id, aar, arrangement_navn, ansvarlig_id')
    .eq('purredato', dag)
    .is('arrangement_id', null)
    .not('ansvarlig_id', 'is', null)
  return data ?? []
}

export async function kjorPaaminnelser(admin: Admin) {
  const idag = norskDatoNaa()
  const idagStr = dagStreng(idag)
  const dag7 = dagStreng(addDays(idag, 7))
  const dag3 = dagStreng(addDays(idag, 3))
  const dag1 = dagStreng(addDays(idag, 1))

  const [arr_7, arr_1, arr_3, arrangorPurringer] = await Promise.all([
    hentForDag(admin, dag7),
    hentForDag(admin, dag1),
    hentForDag(admin, dag3),
    hentArrangorPurringer(admin, idagStr),
  ])

  const oppgaver: Promise<{ id: string; type: string }>[] = []

  for (const a of arr_7 as Arrangement[]) {
    oppgaver.push(
      sendPaaminneVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt, type: 'paaminne_7' })
        .then(() => ({ id: a.id, type: 'paaminne_7' }))
    )
  }
  for (const a of arr_1 as Arrangement[]) {
    oppgaver.push(
      sendPaaminneVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt, type: 'paaminne_1' })
        .then(() => ({ id: a.id, type: 'paaminne_1' }))
    )
  }
  for (const a of arr_3 as Arrangement[]) {
    oppgaver.push(
      sendPurringVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt })
        .then(() => ({ id: a.id, type: 'purring' }))
    )
  }
  for (const a of arrangorPurringer) {
    oppgaver.push(
      sendArrangorPurringVarsler({ ansvarligId: a.ansvarlig_id!, arrangementNavn: a.arrangement_navn, aar: a.aar })
        .then(() => ({ id: a.id, type: 'arrangor_purring' }))
    )
  }

  const utfall = await Promise.allSettled(oppgaver)
  const behandlet = utfall
    .filter((r): r is PromiseFulfilledResult<{ id: string; type: string }> => r.status === 'fulfilled')
    .map(r => r.value)
  const feil = utfall.filter(r => r.status === 'rejected').length

  return { behandlet, feil }
}
