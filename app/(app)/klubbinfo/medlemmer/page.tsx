import { createServerClient } from '@/lib/supabase/server'
import { getProfil } from '@/lib/auth-cache'
import Link from 'next/link'

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
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/klubbinfo" className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>← Tilbake</Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--tekst)' }}>Medlemmer</h1>
        </div>
        {erAdmin && (
          <Link
            href="/klubbinfo/medlemmer/ny"
            className="px-3 py-1.5 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--aksent)', color: '#fff' }}
          >
            + Legg til
          </Link>
        )}
      </div>

      {/* Send e-post til alle */}
      <a
        href={`mailto:?bcc=${alleEposter}`}
        className="flex items-center gap-2 w-full rounded-xl px-4 py-3 mb-6 text-sm font-medium transition-colors"
        style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)', color: 'var(--aksent-lys)' }}
      >
        ✉️ Send e-post til alle gutta
      </a>

      {/* Aktive medlemmer */}
      <div className="space-y-2">
        {aktive.map(m => (
          <div
            key={m.id}
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold" style={{ color: 'var(--tekst)' }}>
                {m.navn}
                {m.rolle === 'admin' && (
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(193,127,36,0.15)', color: 'var(--aksent-lys)' }}>
                    admin
                  </span>
                )}
              </p>
              {erAdmin && (
                <Link
                  href={`/klubbinfo/medlemmer/${m.id}/rediger`}
                  className="text-xs"
                  style={{ color: 'var(--tekst-dempet)' }}
                >
                  Rediger
                </Link>
              )}
            </div>
            <div className="flex gap-4">
              {m.telefon && (
                <a href={`tel:${m.telefon}`} className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>
                  📞 {m.telefon}
                </a>
              )}
              <a href={`mailto:${m.epost}`} className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>
                ✉️ {m.epost}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Inaktive */}
      {erAdmin && inaktive.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: 'var(--tekst-dempet)' }}>
            Tidligere medlemmer
          </p>
          <div className="space-y-2">
            {inaktive.map(m => (
              <div
                key={m.id}
                className="rounded-xl px-4 py-3 opacity-50"
                style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold" style={{ color: 'var(--tekst)' }}>{m.navn}</p>
                  <Link href={`/klubbinfo/medlemmer/${m.id}/rediger`} className="text-xs" style={{ color: 'var(--tekst-dempet)' }}>
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
