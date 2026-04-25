import { describe, it, expect } from 'vitest'
import { erMeldingLevende, MELDING_LEVENDE_DAGER, MELDING_AKTIVITET_DAGER, type MeldingRaad } from '@/lib/agenda-sortering'

// Verifiserer reglene for når en melding er «levende» (vises øverst på
// agenda) versus skal falle til Tidligere-seksjonen. Reglene:
//   levende = (nå - opprettet) ≤ 7 dager   ELLER
//             (nå - sist_aktivitet) < 2 dager

const DAG_MS = 24 * 60 * 60 * 1000

// Fast referansetidspunkt — gjør testene deterministiske og uavhengige
// av at små klokkeavvik mellom lagMelding() og erMeldingLevende() ellers
// kan gjøre randtilfeller flaky.
const NAA_FAST = new Date('2026-04-25T12:00:00Z')

function lagMelding(opprettetDagerSiden: number, aktivitetDagerSiden: number): MeldingRaad {
  const naaMs = NAA_FAST.getTime()
  return {
    id: 'm1',
    innhold: 'test',
    opprettet: new Date(naaMs - opprettetDagerSiden * DAG_MS).toISOString(),
    sist_aktivitet: new Date(naaMs - aktivitetDagerSiden * DAG_MS).toISOString(),
    forfatter: { id: 'p', navn: 'Ola', bilde_url: null, rolle: null },
    reaksjoner: [],
    antallKommentarer: 0,
  }
}

describe('erMeldingLevende', () => {
  const naa = NAA_FAST

  it('er levende rett etter opprettelse', () => {
    expect(erMeldingLevende(lagMelding(0, 0), naa)).toBe(true)
  })

  it('er levende på dag 7 etter opprettelse uten aktivitet', () => {
    expect(erMeldingLevende(lagMelding(MELDING_LEVENDE_DAGER, MELDING_LEVENDE_DAGER), naa)).toBe(true)
  })

  it('er IKKE levende dag 8 uten aktivitet', () => {
    expect(erMeldingLevende(lagMelding(8, 8), naa)).toBe(false)
  })

  it('forlenges med 2 dager fra siste aktivitet', () => {
    // Opprettet for 10 dager siden, men kommentar i går → fortsatt levende
    expect(erMeldingLevende(lagMelding(10, 1), naa)).toBe(true)
  })

  it('faller til tidligere når både 7 dager har gått OG 2 dager siden siste aktivitet', () => {
    // Opprettet for 10 dager siden, siste aktivitet for 3 dager siden → ikke levende
    expect(erMeldingLevende(lagMelding(10, 3), naa)).toBe(false)
  })

  it('eksakt 2 dager siden aktivitet: ikke lenger levende (strikt mindre enn)', () => {
    expect(erMeldingLevende(lagMelding(10, MELDING_AKTIVITET_DAGER), naa)).toBe(false)
  })

  it('like under 2 dager siden aktivitet: levende', () => {
    expect(erMeldingLevende(lagMelding(10, 1.99), naa)).toBe(true)
  })
})
