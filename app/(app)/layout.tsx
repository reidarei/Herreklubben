import BottomNav from '@/components/BottomNav'
import SkyBakgrunn from '@/components/SkyBakgrunn'
import ServiceWorkerRegistrering from '@/components/ServiceWorkerRegistrering'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getInnloggetBruker()

  if (!user) redirect('/login')

  const profil = await getProfil()
  const erAdmin = profil?.rolle === 'admin'

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bakgrunn)' }}>
      <ServiceWorkerRegistrering />
      <SkyBakgrunn />
      <main className="flex-1 pb-20 relative z-10">
        {children}
      </main>
      <BottomNav erAdmin={erAdmin} />
    </div>
  )
}
