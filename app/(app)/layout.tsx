import BottomNav from '@/components/BottomNav'
import SkyBakgrunn from '@/components/SkyBakgrunn'
import ServiceWorkerRegistrering from '@/components/ServiceWorkerRegistrering'
import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profil } = await supabase
    .from('profiles')
    .select('rolle')
    .eq('id', user.id)
    .single()

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
