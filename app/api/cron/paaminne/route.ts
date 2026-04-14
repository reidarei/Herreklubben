import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaaminneVarsler, sendPurringVarsler } from '@/lib/varsler'
import { NextRequest, NextResponse } from 'next/server'
import { addDays } from 'date-fns'

async function kjorPaaminnelser(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ feil: 'Uautorisert' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // TODO: bruk global tidsstyring når den er på plass (alltid 08:00 norsk tid)
  const naa = new Date()

  // Datobasert sjekk: finn arrangementer på nøyaktig riktig dato
  const dag7 = addDays(naa, 7).toISOString().slice(0, 10)
  const dag1 = addDays(naa, 1).toISOString().slice(0, 10)
  const dag3 = addDays(naa, 3).toISOString().slice(0, 10)

  const [{ data: arr_7 }, { data: arr_1 }, { data: arr_3 }] = await Promise.all([
    supabase.from('arrangementer').select('id, tittel, start_tidspunkt')
      .gte('start_tidspunkt', `${dag7}T00:00:00`)
      .lt('start_tidspunkt', `${dag7}T23:59:59`),
    supabase.from('arrangementer').select('id, tittel, start_tidspunkt')
      .gte('start_tidspunkt', `${dag1}T00:00:00`)
      .lt('start_tidspunkt', `${dag1}T23:59:59`),
    supabase.from('arrangementer').select('id, tittel, start_tidspunkt')
      .gte('start_tidspunkt', `${dag3}T00:00:00`)
      .lt('start_tidspunkt', `${dag3}T23:59:59`),
  ])

  const resultater = []

  for (const a of arr_7 ?? []) {
    await sendPaaminneVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt, type: 'paaminne_7' })
    resultater.push({ id: a.id, type: 'paaminne_7' })
  }

  for (const a of arr_1 ?? []) {
    await sendPaaminneVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt, type: 'paaminne_1' })
    resultater.push({ id: a.id, type: 'paaminne_1' })
  }

  for (const a of arr_3 ?? []) {
    await sendPurringVarsler({ arrangementId: a.id, tittel: a.tittel, startTidspunkt: a.start_tidspunkt })
    resultater.push({ id: a.id, type: 'purring' })
  }

  return NextResponse.json({ ok: true, behandlet: resultater })
}

// Vercel Cron sender GET-requests
export async function GET(req: NextRequest) {
  return kjorPaaminnelser(req)
}

// Behold POST for manuell triggering
export async function POST(req: NextRequest) {
  return kjorPaaminnelser(req)
}
