import { Suspense } from 'react'
import TopHeader from '@/components/TopHeader'
import PageTransition from '@/components/PageTransition'
import ServiceWorkerRegistrering from '@/components/ServiceWorkerRegistrering'
import DraNedForOppdater from '@/components/DraNedForOppdater'
import DeployInfo from '@/components/DeployInfo'
import InstallVeiledning from '@/components/InstallVeiledning'
import { getInnloggetBruker, getProfil } from '@/lib/auth-cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { harUlestChat } from '@/lib/ulest'

async function HeaderMedProfil() {
  const [profil, supabase] = await Promise.all([getProfil(), createServerClient()])
  // getInnloggetBruker() er cachet — ingen ekstra nettverkskall
  const user = await getInnloggetBruker()
  // Ulest-sjekk parallelliseres ikke med profil fordi vi trenger supabase-klienten
  // og user-id-en først. Feil her skal aldri blokkere render — fallback false.
  const ulestChat = user ? await harUlestChat(supabase, user.id).catch(() => false) : false

  return (
    <TopHeader
      brukerNavn={profil?.navn}
      bildeUrl={profil?.bilde_url ?? null}
      rolle={profil?.rolle ?? null}
      ulestChat={ulestChat}
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
      <Suspense fallback={<TopHeader />}>
        <HeaderMedProfil />
      </Suspense>
      <main className="flex-1 relative z-10">
        <PageTransition>{children}</PageTransition>
        <DeployInfo />
      </main>
    </div>
  )
}
