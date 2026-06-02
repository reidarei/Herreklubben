'use client'

// Inline RSVP-knapper for ubesvart-seksjonen på agendaen (#271).
// Kompakt tre-knapper-rad: Ja / Kanskje / Nei.
// Komponenten sitter *utenfor* <Link>-wrapperen i page.tsx, så klikk
// på knappene navigerer ikke til arrangementet (se kommentar under).
// useTransition gir optimistic pending-state uten ekstra setState.

import { useState, useTransition } from 'react'
import { oppdaterPaamelding } from '@/lib/actions/paameldinger'
import RsvpGlyph from '@/components/arrangement/RsvpGlyph'

type Status = 'ja' | 'kanskje' | 'nei'

const knapper: Array<{
  id: Status
  label: string
  ikon: 'check' | 'question' | 'x'
}> = [
  { id: 'ja', label: 'Ja', ikon: 'check' },
  { id: 'kanskje', label: 'Kanskje', ikon: 'question' },
  { id: 'nei', label: 'Nei', ikon: 'x' },
]

export default function RsvpInline({ arrangementId }: { arrangementId: string }) {
  // Optimistic state: sett lokalt med én gang, server-kall i bakgrunnen.
  // Ved feil rulleres tilbake til null (visningen er da uendret).
  const [valgt, setValgt] = useState<Status | null>(null)
  const [isPending, startTransition] = useTransition()

  function velg(status: Status) {
    const forrige = valgt
    setValgt(status) // optimistisk
    startTransition(async () => {
      try {
        await oppdaterPaamelding(arrangementId, status)
        // revalidatePath('/') i server action sørger for at arrangementet
        // forsvinner fra ubesvart-seksjonen etter at serveren svarer.
      } catch {
        setValgt(forrige) // rull tilbake ved feil
      }
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '10px 12px 12px',
        // Henger visuelt sammen med ArrangementKort over: samme bakgrunn,
        // border på sidene og bunn, flat topp (kortet har border-bottom allerede).
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderTop: 'none',
        borderRadius: '0 0 var(--radius-card) var(--radius-card)',
        // Kompenser for at kortet allerede bruker overflow:hidden — vi er et
        // separat DOM-element, så vi trenger ikke ekstra margin-top-justering.
      }}
    >
      {knapper.map(k => {
        const erValgt = valgt === k.id
        const erJa = k.id === 'ja'
        return (
          <button
            key={k.id}
            disabled={isPending}
            onClick={e => {
              // Stopp klikket fra å nå <Link>-wrapper-en rundt kortet (#271).
              // preventDefault+stopPropagation er nødvendig fordi React
              // bubbler syntetiske hendelser opp til Next.js sin Link-handler.
              e.preventDefault()
              e.stopPropagation()
              velg(k.id)
            }}
            aria-label={k.label}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              // Minste touch-mål 44px (Apple HIG)
              minHeight: 44,
              borderRadius: 10,
              border: erValgt
                ? erJa
                  ? 'none'
                  : '0.5px solid var(--border-strong)'
                : '0.5px solid var(--border)',
              background: erValgt
                ? erJa
                  ? 'var(--accent)'
                  : 'var(--bg-elevated)'
                : 'transparent',
              color: erValgt && erJa ? '#0a0a0a' : 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              cursor: isPending ? 'wait' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              transition: 'background 0.12s, border 0.12s, opacity 0.12s',
            }}
          >
            <RsvpGlyph
              name={k.ikon}
              size={13}
              color={
                erValgt && erJa
                  ? '#0a0a0a'
                  : k.id === 'ja'
                  ? 'var(--accent)'
                  : k.id === 'kanskje'
                  ? 'var(--text-secondary)'
                  : 'var(--text-tertiary)'
              }
            />
            {k.label}
          </button>
        )
      })}
    </div>
  )
}
