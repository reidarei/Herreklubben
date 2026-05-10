import { addDays } from 'date-fns'
import { norskDatoNaa, naa } from '@/lib/dato'
import {
  sendPaaminneVarsler,
  sendPurringVarsler,
  sendArrangorPurringVarsler,
  sendKaaringspollVinnerVarsel,
  sendKaaringspollTiebreakVarsel,
  sendKaaringspollIngenStemmerVarsel,
} from '@/lib/varsler'
import { PAAMINNELSE_DAGER } from '@/lib/konstanter'
import { rollerMed } from '@/lib/roller'
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
  const dag7 = dagStreng(addDays(idag, PAAMINNELSE_DAGER.LANG))
  const dag3 = dagStreng(addDays(idag, PAAMINNELSE_DAGER.PURRING))
  const dag1 = dagStreng(addDays(idag, PAAMINNELSE_DAGER.KORT))

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
  let feil = utfall.filter(r => r.status === 'rejected').length

  // ─── Kåringspoll: lukk de som har passert frist ───────────────────────────
  // RPC-en avslutt_kaaringspoll er idempotent, så å kjøre den hver dag på
  // samme poll er trygt — den returnerer var_ny=false andre gang. Status-
  // verdien styrer hvilket varsel vi sender.
  const { lukketKaaringer, sendteVarsler, kaaringFeil } =
    await behandleKaaringspoller(admin)
  feil += kaaringFeil

  return { behandlet, feil, lukketKaaringer, sendteVarsler }
}

async function behandleKaaringspoller(admin: Admin) {
  let lukketKaaringer = 0
  let sendteVarsler = 0
  let kaaringFeil = 0

  // Hent åpne kåringspoller med utløpt frist. partial-indexen
  // poll_kaaring_aapne dekker dette filteret presist.
  const { data: aapne } = await admin
    .from('poll')
    .select('id, spoersmaal')
    .not('kaaring_mal_id', 'is', null)
    .is('avsluttet_paa', null)
    .lt('svarfrist', naa())

  if (!aapne || aapne.length === 0) {
    return { lukketKaaringer, sendteVarsler, kaaringFeil }
  }

  // Mottakere av tiebreak- og ingen-stemmer-varsel: alle med
  // admin-rettigheter (admin + generalsekretær). Hvorvidt det burde
  // begrenses til kun generalsekretær er en åpen produkt-beslutning —
  // se PR-kommentar #87. Hvis det skal smalne, lag rettighet
  // `loeserTiebreak` i lib/roller.ts og bruk den her i stedet.
  const adminRoller = rollerMed('kanAdministrere')
  const { data: adminProfiler } = await admin
    .from('profiles')
    .select('id')
    .in('rolle', adminRoller)
    .eq('aktiv', true)
  const adminIder = (adminProfiler ?? []).map(p => p.id)

  for (const poll of aapne) {
    try {
      const { data: rpcRes, error: rpcErr } = await admin.rpc(
        'avslutt_kaaringspoll',
        { p_poll_id: poll.id },
      )
      if (rpcErr) {
        kaaringFeil += 1
        continue
      }
      const rad = Array.isArray(rpcRes) ? rpcRes[0] : rpcRes
      if (!rad || !rad.var_ny) continue

      lukketKaaringer += 1
      const status = rad.status as string

      if (status === 'avgjort') {
        await sendKaaringspollVinnerVarsel({
          pollId: poll.id,
          spoersmaal: poll.spoersmaal,
        })
        sendteVarsler += 1
      } else if (status === 'venter_paa_tiebreak') {
        if (adminIder.length > 0) {
          await sendKaaringspollTiebreakVarsel({
            pollId: poll.id,
            spoersmaal: poll.spoersmaal,
            mottakere: adminIder,
          })
          sendteVarsler += 1
        }
      } else if (status === 'ingen_stemmer') {
        if (adminIder.length > 0) {
          await sendKaaringspollIngenStemmerVarsel({
            pollId: poll.id,
            spoersmaal: poll.spoersmaal,
            mottakere: adminIder,
          })
          sendteVarsler += 1
        }
      }
    } catch {
      kaaringFeil += 1
    }
  }

  return { lukketKaaringer, sendteVarsler, kaaringFeil }
}
