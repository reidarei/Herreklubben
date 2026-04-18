import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import Link from 'next/link'
import { ChevronLeftIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import Pill from '@/components/ui/Pill'

export default async function Medlemmer() {
  const supabase = await createServerClient()

  const profil = await getProfil()
  const erAdmin = profil?.rolle === 'admin'

  const { data: medlemmer } = await supabase
    .from('profiles')
    .select('id, navn, epost, telefon, rolle, aktiv')
    .order('navn')

  const aktive = medlemmer?.filter(m => m.aktiv) ?? []
  const inaktive = medlemmer?.filter(m => !m.aktiv) ?? []

  const alleEposter = aktive.map(m => m.epost).join(',')

  return (
    <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/klubbinfo" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            <ChevronLeftIcon className="w-4 h-4" /> Tilbake
          </Link>
          <h1 className="text-[22px] font-bold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Medlemmer</h1>
        </div>
        {erAdmin && (
          <Link
            href="/klubbinfo/medlemmer/ny"
            className="px-3.5 py-2 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}
          >
            + Legg til
          </Link>
        )}
      </div>

      {/* Send e-post til alle */}
      <a
        href={`mailto:?bcc=${alleEposter}`}
        className="flex items-center gap-2.5 w-full rounded-2xl px-5 py-3.5 mb-6 text-sm font-medium transition-colors"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--accent)', textDecoration: 'none' }}
      >
        <EnvelopeIcon className="w-4 h-4" />
        Send e-post til alle gutta
      </a>

      {/* Aktive medlemmer */}
      <div className="space-y-2.5">
        {aktive.map(m => (
          <div
            key={m.id}
            className="rounded-2xl px-5 py-3.5"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <Link href={`/klubbinfo/medlemmer/${m.id}`} className="font-semibold" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                {m.navn}
                {m.rolle === 'admin' && (
                  <span className="ml-2"><Pill variant="accent">admin</Pill></span>
                )}
              </Link>
              {erAdmin && (
                <Link
                  href={`/klubbinfo/medlemmer/${m.id}/rediger`}
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                >
                  Rediger
                </Link>
              )}
            </div>
            <div className="flex gap-4">
              {m.telefon && (
                <a href={`tel:${m.telefon}`} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                  <PhoneIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                  {m.telefon}
                </a>
              )}
              <a href={`mailto:${m.epost}`} className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                <EnvelopeIcon className="w-3.5 h-3.5" style={{ color: 'var(--text-tertiary)' }} />
                {m.epost}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Inaktive */}
      {erAdmin && inaktive.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>
            Tidligere medlemmer
          </p>
          <div className="space-y-2.5">
            {inaktive.map(m => (
              <div
                key={m.id}
                className="rounded-2xl px-5 py-3.5 opacity-50"
                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{m.navn}</p>
                  <Link href={`/klubbinfo/medlemmer/${m.id}/rediger`} className="text-xs" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Rediger
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
