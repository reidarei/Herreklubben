import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfil } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import SendTestKnapp from './SendTestKnapp'
import VarselToggle from '@/components/VarselToggle'
import ArrangementmalerAdmin from '@/components/ArrangementmalerAdmin'
import KaaringMalAdmin from '@/components/KaaringMalAdmin'

const typeLabels: Record<string, string> = {
  nytt: 'Nytt arrangement',
  paaminne_7: 'Påminnelse 7 dager',
  paaminne_1: 'Påminnelse 1 dag',
  purring: 'Purring',
}

const innstillingLabels: Record<string, string> = {
  nytt_arrangement: 'Varsel ved nytt arrangement',
  paaminnelse_7d: 'Påminnelse 7 dager før',
  paaminnelse_1d: 'Påminnelse 1 dag før',
  purring_aktiv: 'Purring til de som ikke har svart (3 dager før)',
}

export default async function Innstillinger() {
  const [supabase, profil] = await Promise.all([
    createServerClient(),
    getProfil(),
  ])

  if (profil?.rolle !== 'admin') notFound()

  const admin = createAdminClient()
  const [{ data: logg }, { count: pushCount }, { data: innstillinger }, { data: maler }, { data: kaaringmaler }] = await Promise.all([
    admin
      .from('varsler_logg')
      .select('id, type, sendt_at, arrangementer (tittel)')
      .order('sendt_at', { ascending: false })
      .limit(30),
    supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('varsel_innstillinger')
      .select('noekkel, aktiv, beskrivelse')
      .order('noekkel'),
    (admin as any)
      .from('arrangementmaler')
      .select('id, navn, rekkefølge')
      .order('rekkefølge'),
    (admin as any)
      .from('kaaringmaler')
      .select('id, navn, rekkefolge')
      .order('rekkefolge'),
  ])

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/klubbinfo" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ChevronLeftIcon className="w-4 h-4" /> Tilbake
        </Link>
        <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Innstillinger</h1>
      </div>

      {/* Push-status */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Push-varsler</p>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          {pushCount ?? 0} enhet{(pushCount ?? 0) !== 1 ? 'er' : ''} registrert
        </p>
      </div>

      {/* Varsler av/på */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Varsler</p>
        <div className="space-y-1">
          {(innstillinger ?? []).map(inn => (
            <VarselToggle
              key={inn.noekkel}
              noekkel={inn.noekkel}
              aktiv={inn.aktiv}
              beskrivelse={innstillingLabels[inn.noekkel] ?? inn.beskrivelse ?? inn.noekkel}
            />
          ))}
        </div>
        <div className="mt-4">
          <SendTestKnapp />
        </div>
      </div>

      {/* Arrangementmaler */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Faste arrangementer</p>
        <ArrangementmalerAdmin maler={maler ?? []} />
      </div>

      {/* Kåringmaler */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Kåringer</p>
        <KaaringMalAdmin maler={kaaringmaler ?? []} />
      </div>

      {/* Varselhistorikk */}
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--accent)' }}>Siste varsler</h2>
      {!logg || logg.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ingen varsler sendt ennå.</p>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {logg.map((v, i) => (
            <div key={v.id} className="flex items-center justify-between px-4 py-2.5 text-xs"
              style={{
                background: i % 2 === 0 ? 'var(--bg-elevated)' : 'var(--bg)',
                borderTop: i > 0 ? '1px solid var(--border)' : undefined,
              }}>
              <div>
                <p style={{ color: 'var(--text-primary)' }}>{typeLabels[v.type] ?? v.type}</p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {v.arrangementer?.tittel}
                </p>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                {v.sendt_at ? format(new Date(v.sendt_at), 'd. MMM HH:mm', { locale: nb }) : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
