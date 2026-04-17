import { createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getProfil } from '@/lib/auth-cache'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import VarselToggle from '@/components/VarselToggle'
import IssuesListe from './IssuesListe'
import VarselLogg from './VarselLogg'
import ArrangementmalerAdmin from '@/components/ArrangementmalerAdmin'
import KaaringMalAdmin from '@/components/KaaringMalAdmin'

const innstillingLabels: Record<string, string> = {
  nytt_arrangement: 'Varsel ved nytt arrangement',
  paaminnelse_7d: 'Påminnelse 7 dager før',
  paaminnelse_1d: 'Påminnelse 1 dag før',
  purring_aktiv: 'Purring til de som ikke har svart (3 dager før)',
  arrangor_purring: 'Purring til arrangøransvarlige som ikke har opprettet arrangement',
  test_modus: 'Testmodus — varsler sendes kun til Reidar',
}

export default async function Innstillinger() {
  const [supabase, profil] = await Promise.all([
    createServerClient(),
    getProfil(),
  ])

  if (profil?.rolle !== 'admin') notFound()

  const admin = createAdminClient()
  const [{ data: logg, count: varselTotal }, { count: pushCount }, { data: innstillinger }] = await Promise.all([
    admin
      .from('varsel_logg')
      .select('id, tittel, type, kanal, opprettet, profil_id, profiles (visningsnavn)', { count: 'exact' })
      .order('opprettet', { ascending: false })
      .limit(10),
    supabase
      .from('push_subscriptions')
      .select('id', { count: 'exact', head: true }),
    supabase
      .from('varsel_innstillinger')
      .select('noekkel, aktiv, beskrivelse')
      .order('noekkel'),
  ])
  const { data: maler } = await admin.from('arrangementmaler').select('*').order('rekkefølge')
  const { data: kaaringmaler } = await admin.from('kaaringmaler').select('id, navn, rekkefolge').order('rekkefolge')

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

      {/* Ønsker fra brukerne */}
      <IssuesListe />

      {/* Varselhistorikk */}
      <VarselLogg initial={logg ?? []} total={varselTotal ?? 0} />
    </div>
  )
}
