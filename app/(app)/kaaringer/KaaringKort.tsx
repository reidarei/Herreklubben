'use client'

import { useState, useTransition } from 'react'
import { slettKaaring } from '@/lib/actions/kaaringer'

type Vinner = {
  id: string
  begrunnelse: string | null
  profil_id: string | null
  profiles: { navn: string } | null
  arrangement_id: string | null
  arrangementer: { tittel: string } | null
}

type Kaaring = {
  id: string
  aar: number
  kategori: string
  kaaring_vinnere: Vinner[]
}

export default function KaaringKort({
  kaaring,
  erAdmin,
  medlemmer,
  arrangementer,
}: {
  kaaring: Kaaring
  erAdmin: boolean
  medlemmer: { id: string; navn: string }[]
  arrangementer: { id: string; tittel: string; start_tidspunkt: string }[]
}) {
  const [visSlett, setVisSlett] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSlett() {
    startTransition(async () => {
      await slettKaaring(kaaring.id)
    })
  }

  return (
    <div
      className="rounded-xl px-4 py-3"
      style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="font-semibold text-sm mb-2" style={{ color: 'var(--tekst)' }}>
            {kaaring.kategori}
          </p>
          <div className="space-y-1">
            {kaaring.kaaring_vinnere.map(v => (
              <div key={v.id}>
                <p className="text-sm font-medium" style={{ color: 'var(--aksent-lys)' }}>
                  🥇 {v.profil_id ? v.profiles?.navn : v.arrangementer?.tittel}
                </p>
                {v.begrunnelse && (
                  <p className="text-xs mt-0.5 italic" style={{ color: 'var(--tekst-dempet)' }}>
                    «{v.begrunnelse}»
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {erAdmin && (
          <div>
            {!visSlett ? (
              <button
                onClick={() => setVisSlett(true)}
                className="text-xs px-2 py-1 rounded-lg"
                style={{ border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}
              >
                Slett
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => setVisSlett(false)} className="text-xs px-2 py-1 rounded-lg"
                  style={{ border: '1px solid var(--border)', color: 'var(--tekst-dempet)' }}>
                  Nei
                </button>
                <button onClick={handleSlett} disabled={isPending} className="text-xs px-2 py-1 rounded-lg text-white disabled:opacity-50"
                  style={{ background: '#7f1d1d' }}>
                  Ja
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
