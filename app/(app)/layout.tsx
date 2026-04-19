import { Suspense } from 'react'
import BottomNav from '@/components/BottomNav'
import PageTransition from '@/components/PageTransition'
import ServiceWorkerRegistrering from '@/components/ServiceWorkerRegistrering'
import DeployInfo from '@/components/DeployInfo'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { redirect } from 'next/navigation'

async function NavMedRolle() {
  const profil = await getProfil()
  return <BottomNav erAdmin={profil?.rolle === 'admin'} brukerNavn={profil?.navn} />
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getInnloggetBruker()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen">
      <ServiceWorkerRegistrering />
      <main className="flex-1 pb-24 relative z-10">
        <div style={{ height: 'env(safe-area-inset-top)' }} aria-hidden="true" />
        <PageTransition>{children}</PageTransition>
        <DeployInfo />
      </main>
      <Suspense fallback={<BottomNav erAdmin={false} />}>
        <NavMedRolle />
      </Suspense>
    </div>
  )
}
