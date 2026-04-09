import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import AnsvarAdmin from './AnsvarAdmin'

const FASTE_ARRANGEMENTER = [
  'Januar-februar møte',
  'Mars-april møte',
  'Mai-juni møte',
  'August-september møte',
  'Oktober-november møte',
  'Julebord',
  'Reisekomiteen',
]

export default async function Arrangoransvar() {
  const supabase = await createServerClient()
  const [user, profil] = await Promise.all([getInnloggetBruker(), getProfil()])
  const erAdmin = profil?.rolle === 'admin'

  const innevaerendeAar = new Date().getFullYear()
  const visAar = [innevaerendeAar, innevaerendeAar + 1]

  const [{ data: ansvar }, { data: medlemmer }] = await Promise.all([
    supabase
      .from('arrangoransvar')
      .select(`id, aar, arrangement_navn, ansvarlig_id, profiles (id, navn), arrangementer (id, tittel)`)
      .in('aar', visAar)
      .order('aar'),
    supabase.from('profiles').select('id, navn').eq('aktiv', true).order('navn'),
  ])

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/klubbinfo" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ChevronLeftIcon className="w-4 h-4" /> Tilbake
        </Link>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Arrangøransvar</h1>
      </div>

      {visAar.map(aar => (
        <div key={aar} className="mb-8">
          <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--accent)' }}>{aar}</h2>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            {FASTE_ARRANGEMENTER.map((navn, i) => {
              const rad = (ansvar ?? []).find(
                a => a.aar === aar && a.arrangement_navn.trim().toLowerCase() === navn.toLowerCase()
              )
              const erMitt = rad?.ansvarlig_id === user!.id

              return (
                <div
                  key={navn}
                  className="px-4 py-3"
                  style={{
                    borderTop: i > 0 ? '1px solid var(--border-subtle)' : undefined,
                    background: erMitt ? 'var(--accent-subtle)' : undefined,
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: erMitt ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {navn}
                        {erMitt && <span className="ml-2 text-xs" style={{ color: 'var(--accent)' }}>← deg</span>}
                      </p>
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {rad?.profiles?.navn ?? <span style={{ color: 'var(--text-tertiary)' }}>Ingen ansvarlig</span>}
                      </p>
                      {rad?.arrangementer ? (
                        <Link href={`/arrangementer/${rad.arrangementer.id}`} className="text-xs mt-0.5 inline-block" style={{ color: 'var(--success)' }}>
                          ✓ Lagt inn
                        </Link>
                      ) : (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Ikke lagt inn ennå</p>
                      )}
                      {erAdmin && (
                        <AnsvarAdmin
                          ansvarId={rad?.id}
                          arrangementNavn={navn}
                          aar={aar}
                          ansvarligId={rad?.ansvarlig_id}
                          medlemmer={medlemmer ?? []}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
