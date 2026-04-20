import { Suspense } from 'react'
import BottomNav from '@/components/BottomNav'
import PageTransition from '@/components/PageTransition'
import ServiceWorkerRegistrering from '@/components/ServiceWorkerRegistrering'
import DraNedForOppdater from '@/components/DraNedForOppdater'
import DeployInfo from '@/components/DeployInfo'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { redirect } from 'next/navigation'

async function NavMedRolle() {
  const profil = await getProfil()
  return (
    <BottomNav
      brukerNavn={profil?.navn}
      bildeUrl={profil?.bilde_url ?? null}
    />
  )
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getInnloggetBruker()
  if (!user) redirect('/login')

  return (
    <div
      className="flex flex-col min-h-screen relative"
      style={{
        maxWidth: 480,
        margin: '0 auto',
        boxShadow: '0 0 0 0.5px var(--border-subtle)',
      }}
    >
      <ServiceWorkerRegistrering />
      <DraNedForOppdater />
      <main className="flex-1 pb-24 relative z-10">
        <div style={{ height: 'env(safe-area-inset-top)' }} aria-hidden="true" />
        <PageTransition>{children}</PageTransition>
        <DeployInfo />
      </main>
      <Suspense fallback={<BottomNav />}>
        <NavMedRolle />
      </Suspense>
    </div>
  )
}
