import { createServerClient } from '@/lib/supabase/server'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import AnsvarAdmin from './AnsvarAdmin'
import { norskAar } from '@/lib/dato'

export default async function Arrangoransvar() {
  const supabase = await createServerClient()
  const [user, profil] = await Promise.all([getInnloggetBruker(), getProfil()])
  const erAdmin = profil?.rolle === 'admin'

  const innevaerendeAar = norskAar()
  const visAar = [innevaerendeAar, innevaerendeAar + 1]

  const [{ data: ansvar }, { data: medlemmer }, { data: maler }] = await Promise.all([
    supabase
      .from('arrangoransvar')
      .select(`id, aar, arrangement_navn, ansvarlig_id, profiles (id, navn), arrangementer (id, tittel, start_tidspunkt)`)
      .in('aar', visAar)
      .order('aar'),
    supabase.from('profiles').select('id, navn').eq('aktiv', true).order('navn'),
    (supabase as any).from('arrangementmaler').select('navn').order('rekkefølge'),
  ])

  const fasteArrangementer = ((maler ?? []) as { navn: string }[]).map(m => m.navn)

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
            {fasteArrangementer.map((navn, i) => {
              const rader = (ansvar ?? []).filter(
                a => a.aar === aar && a.arrangement_navn.trim().toLowerCase() === navn.toLowerCase()
              )
              const erMitt = rader.some(r => r.ansvarlig_id === user!.id)
              const lenketArr = rader.find(r => r.arrangementer)?.arrangementer

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
                      {rader.filter(r => r.profiles).length > 0 ? (
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {rader.filter(r => r.profiles).map(r => r.profiles!.navn).join(', ')}
                        </p>
                      ) : (
                        <p className="text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>Ingen ansvarlig</p>
                      )}
                      {lenketArr ? (
                        <Link href={`/arrangementer/${lenketArr.id}`} className="text-xs mt-0.5 inline-block" style={{ color: 'var(--success)' }}>
                          {new Date(lenketArr.start_tidspunkt) < new Date() ? '✓ Gjennomført' : '✓ Lagt inn'}
                        </Link>
                      ) : (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--destructive)' }}>✗ Ikke lagt inn ennå</p>
                      )}
                      {erAdmin && (
                        <AnsvarAdmin
                          ansvarlige={rader.filter(r => r.ansvarlig_id).map(r => ({ ansvarId: r.id, profilId: r.ansvarlig_id! }))}
                          arrangementNavn={navn}
                          aar={aar}
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
