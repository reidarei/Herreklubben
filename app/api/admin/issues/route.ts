import { getProfil } from '@/lib/auth-cache'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const profil = await getProfil()
  if (profil?.rolle !== 'admin') return NextResponse.json({ error: 'Ikke tilgang' }, { status: 403 })

  const token = process.env.GITHUB_TOKEN
  if (!token) return NextResponse.json({ data: [] })

  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1')
  const perPage = parseInt(req.nextUrl.searchParams.get('per_page') ?? '10')
  const state = req.nextUrl.searchParams.get('state') ?? 'closed'

  const res = await fetch(
    `https://api.github.com/repos/reidarei/Herreklubben/issues?labels=%C3%B8nske&state=${state}&sort=created&direction=desc&per_page=${perPage}&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    }
  )

  if (!res.ok) return NextResponse.json({ data: [] })
  const data = await res.json()

  return NextResponse.json({ data })
}
