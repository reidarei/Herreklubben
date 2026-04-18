import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import ListRow from '@/components/ui/ListRow'
import Monogram from '@/components/ui/Monogram'
import Card from '@/components/ui/Card'
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { norskAar } from '@/lib/dato'

export default async function Klubbinfo() {
  const [supabase, profil] = await Promise.all([createServerClient(), getProfil()])
  const erAdmin = profil?.rolle === 'admin'
  const aar = norskAar()

  const [{ count: antallMedlemmer }, { count: antallArr }] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('aktiv', true),
    supabase.from('arrangementer').select('id', { count: 'exact', head: true }),
  ])

  const ikonStil = { color: 'var(--text-secondary)', strokeWidth: 1.5 }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      {/* Monogram-banner */}
      <div className="flex flex-col items-center mb-8">
        <Monogram size={80} className="mb-3" />
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 400,
            color: 'var(--text-primary)',
          }}
        >
          Mortensrud Herreklubb
        </h1>
        <p
          className="text-[13px] mt-1"
          style={{
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-tertiary)',
            letterSpacing: '0.02em',
          }}
        >
          Stiftet 2015
        </p>

        {/* Stats-rad */}
        <div className="flex items-center gap-6 mt-4">
          {[
            { tall: antallMedlemmer ?? 0, label: 'Medlemmer' },
            { tall: aar - 2015, label: 'År' },
            { tall: antallArr ?? 0, label: 'Arrangementer' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center">
              <span
                className="text-lg"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--accent)',
                }}
              >
                {s.tall}
              </span>
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Card padding={false}>
        <ListRow
          href="/klubbinfo/medlemmer"
          icon={<UserGroupIcon className="w-[18px] h-[18px]" style={ikonStil} />}
          title="Medlemmer"
          subtitle={`${antallMedlemmer ?? 0} aktive`}
        />
        <ListRow
          href="/arrangoransvar"
          icon={<ClipboardDocumentListIcon className="w-[18px] h-[18px]" style={ikonStil} />}
          title="Arrangøransvar"
          subtitle="Hvem arrangerer hva i år"
        />
        <ListRow
          href="/klubbinfo/vedtekter/vedtekter"
          icon={<DocumentTextIcon className="w-[18px] h-[18px]" style={ikonStil} />}
          title="Vedtekter"
          subtitle="Regler og vedtekter"
        />
        <ListRow
          href="/klubbinfo/vedtekter/historikk"
          icon={<BuildingLibraryIcon className="w-[18px] h-[18px]" style={ikonStil} />}
          title="Historikk"
          subtitle="Klubbens historie"
        />
        <ListRow
          href="/klubbinfo/statistikk"
          icon={<ChartBarIcon className="w-[18px] h-[18px]" style={ikonStil} />}
          title="Statistikk"
          subtitle="Deltagelse og rekorder"
        />
        {erAdmin && (
          <ListRow
            href="/innstillinger"
            icon={<Cog6ToothIcon className="w-[18px] h-[18px]" style={ikonStil} />}
            title="Innstillinger"
            subtitle="Varsler og påminnelser"
          />
        )}
      </Card>
    </div>
  )
}
