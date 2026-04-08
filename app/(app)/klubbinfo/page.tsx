import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'

const kortstil = {
  background: 'var(--bakgrunn-kort)',
  border: '1px solid var(--border)',
  borderRadius: '0.75rem',
  padding: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  textDecoration: 'none',
}

export default async function Klubbinfo() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user!.id).single()
  const erAdmin = profil?.rolle === 'admin'

  const { data: medlemmer } = await supabase.from('profiles').select('id').eq('aktiv', true)
  const antallMedlemmer = medlemmer?.length ?? 0

  return (
    <div className="max-w-lg mx-auto px-4 pt-10 pb-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--tekst)' }}>Klubbinfo</h1>

      <div className="space-y-3">
        <Link href="/klubbinfo/medlemmer" style={kortstil as React.CSSProperties}>
          <span className="text-2xl">👥</span>
          <div>
            <p className="font-semibold" style={{ color: 'var(--tekst)' }}>Medlemmer</p>
            <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>{antallMedlemmer} aktive</p>
          </div>
          <span className="ml-auto" style={{ color: 'var(--tekst-dempet)' }}>→</span>
        </Link>

        <Link href="/arrangoransvar" style={kortstil as React.CSSProperties}>
          <span className="text-2xl">📋</span>
          <div>
            <p className="font-semibold" style={{ color: 'var(--tekst)' }}>Arrangøransvar</p>
            <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>Hvem arrangerer hva i år</p>
          </div>
          <span className="ml-auto" style={{ color: 'var(--tekst-dempet)' }}>→</span>
        </Link>

        <Link href="/klubbinfo/vedtekter/vedtekter" style={kortstil as React.CSSProperties}>
          <span className="text-2xl">📜</span>
          <div>
            <p className="font-semibold" style={{ color: 'var(--tekst)' }}>Vedtekter</p>
            <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>Regler og vedtekter</p>
          </div>
          <span className="ml-auto" style={{ color: 'var(--tekst-dempet)' }}>→</span>
        </Link>

        <Link href="/klubbinfo/vedtekter/historikk" style={kortstil as React.CSSProperties}>
          <span className="text-2xl">🏛️</span>
          <div>
            <p className="font-semibold" style={{ color: 'var(--tekst)' }}>Historikk</p>
            <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>Klubbens historie</p>
          </div>
          <span className="ml-auto" style={{ color: 'var(--tekst-dempet)' }}>→</span>
        </Link>

        <Link href="/klubbinfo/statistikk" style={kortstil as React.CSSProperties}>
          <span className="text-2xl">📊</span>
          <div>
            <p className="font-semibold" style={{ color: 'var(--tekst)' }}>Statistikk</p>
            <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>Deltagelse og rekorder</p>
          </div>
          <span className="ml-auto" style={{ color: 'var(--tekst-dempet)' }}>→</span>
        </Link>

        {erAdmin && (
          <Link href="/innstillinger" style={kortstil as React.CSSProperties}>
            <span className="text-2xl">⚙️</span>
            <div>
              <p className="font-semibold" style={{ color: 'var(--tekst)' }}>Innstillinger</p>
              <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>Varsler og påminnelser</p>
            </div>
            <span className="ml-auto" style={{ color: 'var(--tekst-dempet)' }}>→</span>
          </Link>
        )}
      </div>
    </div>
  )
}
