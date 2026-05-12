import { Suspense } from 'react'
import TopHeader from '@/components/TopHeader'
import PageTransition from '@/components/PageTransition'
import ServiceWorkerRegistrering from '@/components/ServiceWorkerRegistrering'
import DraNedForOppdater from '@/components/DraNedForOppdater'
import DeployInfo from '@/components/DeployInfo'
import InstallVeiledning from '@/components/InstallVeiledning'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { redirect } from 'next/navigation'
import versjon from '@/lib/versjon.json'

async function HeaderMedProfil() {
  const profil = await getProfil()
  return (
    <TopHeader
      brukerNavn={profil?.navn}
      bildeUrl={profil?.bilde_url ?? null}
      rolle={profil?.rolle ?? null}
      versjon={versjon.versjon}
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
      <InstallVeiledning />
      <Suspense fallback={<TopHeader versjon={versjon.versjon} />}>
        <HeaderMedProfil />
      </Suspense>
      <main className="flex-1 relative z-10">
        <PageTransition>{children}</PageTransition>
        <DeployInfo />
      </main>
    </div>
  )
}
