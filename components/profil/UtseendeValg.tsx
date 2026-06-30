'use client'

import { useState, useTransition } from 'react'
import Segment from '@/components/ui/Segment'
import { oppdaterTema } from '@/app/actions/tema'
import { skrivTemaTilStorage } from '@/lib/tema-klient'
import { TEMA_VALG, type TemaValg } from '@/lib/konstanter'
import SectionLabel from '@/components/ui/SectionLabel'

const TEMA_ETIKETTER: Record<TemaValg, string> = {
  system: 'System',
  dark: 'Mørk',
  light: 'Lys',
}

const temaAlternativer = TEMA_VALG.map(v => ({ value: v, label: TEMA_ETIKETTER[v] }))

export default function UtseendeValg({ initial }: { initial: TemaValg }) {
  const [valg, setValg] = useState<TemaValg>(initial)
  const [, startTransition] = useTransition()

  function velg(v: TemaValg) {
    setValg(v)
    skrivTemaTilStorage(v)
    // CustomEvent fanges av TemaSync i layout — øyeblikkelig visuelt bytte uten full re-render
    window.dispatchEvent(new CustomEvent('temaEndret', { detail: v }))
    // Skriv cookie server-side for persistens på tvers av enheter/nettlesere
    startTransition(() => { oppdaterTema(v).catch(() => {}) })
  }

  return (
    <section style={{ marginBottom: 20 }}>
      <SectionLabel>Utseende</SectionLabel>
      <Segment
        value={valg}
        onChange={velg}
        options={temaAlternativer}
      />
    </section>
  )
}
