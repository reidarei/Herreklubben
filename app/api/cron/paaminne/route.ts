import { createAdminClient } from '@/lib/supabase/admin'
import { sendPaaminneVarsler, sendPurringVarsler } from '@/lib/varsler'
import { NextRequest, NextResponse } from 'next/server'
import { addDays, subHours, addHours } from 'date-fns'

async function kjorPaaminnelser(req: NextRequest) {
  // Autentiser med CRON_SECRET
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Uautorisert' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const naa = new Date()

  // Finn arrangementer 7 dager frem (±12t)
  const sju_fra = subHours(addDays(naa, 7), 12).toISOString()
  const sju_til = addHours(addDays(naa, 7), 12).toISOString()

  // Finn arrangementer 1 dag frem (±12t)
  const en_fra = subHours(addDays(naa, 1), 12).toISOString()
  const en_til = addHours(addDays(naa, 1), 12).toISOString()

  // Finn arrangementer 3 dager frem (for purring — de som ikke har svart)
  const tre_fra = subHours(addDays(naa, 3), 12).toISOString()
  const tre_til = addHours(addDays(naa, 3), 12).toISOString()

  const { data: arr_7 } = await supabase
    .from('arrangementer')
    .select('id, tittel, start_tidspunkt')
    .gte('start_tidspunkt', sju_fra)
    .lte('start_tidspunkt', sju_til)

  const { data: arr_1 } = await supabase
    .from('arrangementer')
    .select('id, tittel, start_tidspunkt')
    .gte('start_tidspunkt', en_fra)
    .lte('start_tidspunkt', en_til)

  const { data: arr_3 } = await supabase
    .from('arrangementer')
    .select('id, tittel, start_tidspunkt')
    .gte('start_tidspunkt', tre_fra)
    .lte('start_tidspunkt', tre_til)

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
