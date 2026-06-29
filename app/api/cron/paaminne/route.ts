import { createAdminClient } from '@/lib/supabase/admin'
import { kjorPaaminnelser } from '@/lib/actions/paaminnelser'
import { kjorBursdagsgratulasjon } from '@/lib/actions/bursdagsgratulasjon'
import { formatInTimeZone } from 'date-fns-tz'
import { TIDSSONE } from '@/lib/dato'
import { BURSDAG_VINDU_SLOTS } from '@/lib/konstanter'
import { NextRequest, NextResponse } from 'next/server'

async function handle(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ feil: 'Uautorisert' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Beregn slot-indeks basert på norsk klokketime.
  // Vinduet er 07–10 (4 slots). slotIndex 0 = kl. 07, 3 = kl. 10.
  const norskTime = parseInt(formatInTimeZone(new Date(), TIDSSONE, 'H'))
  const slotIndex = norskTime - 7 // 0-basert; utenfor vinduet kan gi negativ/for høy verdi

  // Påminnelser kjøres kun ved slot 1 (kl. 08 norsk) for å bevare eksisterende sendetidspunkt
  let paaminneResult: Awaited<ReturnType<typeof kjorPaaminnelser>> | null = null
  if (slotIndex === 1) {
    paaminneResult = await kjorPaaminnelser(admin)
  }

  // Bursdagsgratulasjonar kjøres ved alle slots i vinduet (0–3)
  let bursdagResult: Awaited<ReturnType<typeof kjorBursdagsgratulasjon>> | null = null
  if (slotIndex >= 0 && slotIndex < BURSDAG_VINDU_SLOTS) {
    bursdagResult = await kjorBursdagsgratulasjon(admin, {
      slotIndex,
      totalSlots: BURSDAG_VINDU_SLOTS,
    })
  }

  const paaminnerFeil = paaminneResult?.feil ?? 0
  const bursdagFeil = bursdagResult?.feil ?? 0
  const totalFeil = paaminnerFeil + bursdagFeil

  // Returner 500 hvis noe feilet — synliggjør cron-feil i GitHub Actions-loggen
  // i stedet for å skjule dem bak en 200.
  const status = totalFeil > 0 ? 500 : 200
  return NextResponse.json(
    {
      ok: totalFeil === 0,
      slot: slotIndex,
      paaminne: paaminneResult ?? 'hoppet',
      bursdag: bursdagResult ?? 'utenfor vindu',
    },
    { status },
  )
}

// Vercel Cron sender GET-requests
export async function GET(req: NextRequest) {
  return handle(req)
}

// Behold POST for manuell triggering
export async function POST(req: NextRequest) {
  return handle(req)
}
