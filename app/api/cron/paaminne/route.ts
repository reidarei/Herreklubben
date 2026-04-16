import { createAdminClient } from '@/lib/supabase/admin'
import { kjorPaaminnelser } from '@/lib/actions/paaminnelser'
import { NextRequest, NextResponse } from 'next/server'

async function handle(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ feil: 'Uautorisert' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { behandlet, feil } = await kjorPaaminnelser(admin)
  return NextResponse.json({ ok: true, behandlet, feil })
}

// Vercel Cron sender GET-requests
export async function GET(req: NextRequest) {
  return handle(req)
}

// Behold POST for manuell triggering
export async function POST(req: NextRequest) {
  return handle(req)
}
