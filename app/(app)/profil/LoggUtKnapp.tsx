'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoggUtKnapp() {
  const router = useRouter()
  const supabase = createClient()

  async function loggUt() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={loggUt}
      className="w-full rounded-xl px-4 py-3 font-semibold transition-colors"
      style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: '#f87171' }}
    >
      Logg ut
    </button>
  )
}
