'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'

export default function LoggUtKnapp() {
  const router = useRouter()
  const supabase = createClient()

  async function loggUt() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="destructive" fullWidth onClick={loggUt}>Logg ut</Button>
  )
}
