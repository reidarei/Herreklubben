import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import ListRow from '@/components/ui/ListRow'
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'

export default async function Klubbinfo() {
  const [supabase, profil] = await Promise.all([createServerClient(), getProfil()])
  const erAdmin = profil?.rolle === 'admin'

  const { data: medlemmer } = await supabase.from('profiles').select('id').eq('aktiv', true)
  const antallMedlemmer = medlemmer?.length ?? 0

  const ikonStil = { color: 'var(--text-secondary)', strokeWidth: 1.5 }

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <h1
        className="text-[22px] font-bold mb-6"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}
      >
        Klubbinfo
      </h1>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <ListRow
          href="/klubbinfo/medlemmer"
          icon={<UserGroupIcon className="w-[18px] h-[18px]" style={ikonStil} />}
          title="Medlemmer"
          subtitle={`${antallMedlemmer} aktive`}
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
      </div>
    </div>
  )
}
