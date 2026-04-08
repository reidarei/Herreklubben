import { Suspense } from 'react'
import BottomNav from '@/components/BottomNav'
import SkyBakgrunn from '@/components/SkyBakgrunn'
import ServiceWorkerRegistrering from '@/components/ServiceWorkerRegistrering'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { redirect } from 'next/navigation'

async function NavMedRolle() {
  const profil = await getProfil()
  return <BottomNav erAdmin={profil?.rolle === 'admin'} />
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getInnloggetBruker()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bakgrunn)' }}>
      <ServiceWorkerRegistrering />
      <SkyBakgrunn />
      <main className="flex-1 pb-20 relative z-10" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        {children}
      </main>
      <Suspense fallback={<BottomNav erAdmin={false} />}>
        <NavMedRolle />
      </Suspense>
    </div>
  )
}
