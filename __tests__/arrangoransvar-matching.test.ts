import { describe, it, expect } from 'vitest'
import {
  periodeFraNavn,
  finnAnsvarForArrangement,
  type AnsvarForMatching,
} from '@/lib/arrangoransvar-matching'

describe('periodeFraNavn', () => {
  it('matcher januar/februar-møte', () => {
    expect(periodeFraNavn('Januar/Februar-møte')).toEqual({ startMnd: 1, sluttMnd: 2 })
  })
  it('matcher mai/juni uansett formulering', () => {
    expect(periodeFraNavn('Mai/Juni-møtet')).toEqual({ startMnd: 5, sluttMnd: 6 })
  })
  it('matcher julebord', () => {
    expect(periodeFraNavn('Julebord 2026')).toEqual({ startMnd: 12, sluttMnd: 12 })
  })
  it('returnerer null for ukjent navn', () => {
    expect(periodeFraNavn('Sommerfest')).toBeNull()
  })
})

describe('finnAnsvarForArrangement', () => {
  const ansvar: AnsvarForMatching[] = [
    { id: 'a1', aar: 2026, arrangement_navn: 'Mai/Juni-møtet' },
    { id: 'a2', aar: 2026, arrangement_navn: 'August/September-møte' },
    { id: 'a3', aar: 2025, arrangement_navn: 'Mai/Juni-møtet' },
  ]

  it('finner ansvar for 26. juni 2026 (norsk tid)', () => {
    // VM-fest 26. juni 2026 kl 19:00 norsk → skal matche Mai/Juni-møtet 2026
    expect(finnAnsvarForArrangement(ansvar, '2026-06-26T17:00:00Z')).toBe('a1')
  })

  it('sen kveld 30. juni norsk tilhører fortsatt juni', () => {
    // 30. juni kl 23:30 norsk = 21:30 UTC — må ikke rulle over til juli
    expect(finnAnsvarForArrangement(ansvar, '2026-06-30T21:30:00Z')).toBe('a1')
  })

  it('ignorerer feil år', () => {
    expect(finnAnsvarForArrangement(ansvar, '2024-06-15T12:00:00Z')).toBeNull()
  })

  it('returnerer null når ingen periode dekker måneden', () => {
    // Juli er ikke dekket av noen periode
    expect(finnAnsvarForArrangement(ansvar, '2026-07-15T12:00:00Z')).toBeNull()
  })
})
