// Finner hvilken arrangøransvar-rad et arrangement tilhører basert på
// måned-intervallet implisitt i ansvarets navn. Brukes til automatisk
// kobling når en ansvarlig oppretter (eller redigerer) et arrangement
// i sin periode — ingen manuelle valg trengs.
//
// Navnekonvensjon (samme som brukt i 034_sett_purredato_eksisterende.sql):
//   «Januar/Februar-møte»  → mnd 1–2
//   «Mars/April-møte»      → mnd 3–4
//   «Mai/Juni-møtet»       → mnd 5–6
//   «August/September-møte»→ mnd 8–9
//   «Oktober/November-møte»→ mnd 10–11
//   «Julebord» / «jule…»   → mnd 12
//
// Retur: første matchende ansvar-id, eller null hvis ingen match.

import { formaterDato } from '@/lib/dato'

export type AnsvarForMatching = {
  id: string
  arrangement_navn: string
  aar: number
}

export function periodeFraNavn(
  navn: string,
): { startMnd: number; sluttMnd: number } | null {
  const n = navn.toLowerCase()
  if (n.includes('januar') || n.includes('februar')) return { startMnd: 1, sluttMnd: 2 }
  if (n.includes('mars') || n.includes('april')) return { startMnd: 3, sluttMnd: 4 }
  if (n.includes('mai') || n.includes('juni')) return { startMnd: 5, sluttMnd: 6 }
  if (n.includes('august') || n.includes('september')) return { startMnd: 8, sluttMnd: 9 }
  if (n.includes('oktober') || n.includes('november')) return { startMnd: 10, sluttMnd: 11 }
  if (n.includes('jule') || n.includes('desember')) return { startMnd: 12, sluttMnd: 12 }
  return null
}

export function finnAnsvarForArrangement(
  ansvarListe: AnsvarForMatching[],
  startTidspunkt: string,
): string | null {
  // Bruk norsk kalendermåned og år — et arrangement kl. 23:30 norsk 30. juni
  // tilhører juni selv om UTC har krysset midnatt til juli.
  const aar = parseInt(formaterDato(startTidspunkt, 'yyyy'), 10)
  const mnd = parseInt(formaterDato(startTidspunkt, 'M'), 10)

  for (const ansvar of ansvarListe) {
    if (ansvar.aar !== aar) continue
    const periode = periodeFraNavn(ansvar.arrangement_navn)
    if (!periode) continue
    if (mnd >= periode.startMnd && mnd <= periode.sluttMnd) {
      return ansvar.id
    }
  }
  return null
}
