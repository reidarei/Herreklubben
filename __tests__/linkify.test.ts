import { describe, it, expect } from 'vitest'
import { splittPaaUrler } from '@/lib/linkify-core'

describe('splittPaaUrler', () => {
  it('returnerer tom array for tom streng', () => {
    expect(splittPaaUrler('')).toEqual([])
  })

  it('returnerer én tekst-del når ingen URL finnes', () => {
    const result = splittPaaUrler('bare vanlig tekst')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: 'tekst', verdi: 'bare vanlig tekst' })
  })

  it('splitter vanlig URL midt i tekst i 3 deler', () => {
    const result = splittPaaUrler('sjekk https://vg.no test')
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ type: 'tekst', verdi: 'sjekk ' })
    expect(result[1]).toMatchObject({ type: 'url', verdi: 'https://vg.no', href: 'https://vg.no' })
    expect(result[2]).toMatchObject({ type: 'tekst', verdi: ' test' })
  })

  it('trimmer trailing komma fra URL og beholder det som tekst', () => {
    const result = splittPaaUrler('https://vg.no, og mer')
    // Forventer: url-del (uten komma), tekst-del ", og mer"
    expect(result[0]).toMatchObject({ type: 'url', verdi: 'https://vg.no' })
    expect(result[1]).toMatchObject({ type: 'tekst', verdi: ',' })
    expect(result[2]).toMatchObject({ type: 'tekst', verdi: ' og mer' })
  })

  it('håndterer flere URLer i samme tekst', () => {
    const result = splittPaaUrler('se https://vg.no og https://nrk.no')
    const urls = result.filter(d => d.type === 'url')
    expect(urls).toHaveLength(2)
    expect(urls[0]).toMatchObject({ href: 'https://vg.no' })
    expect(urls[1]).toMatchObject({ href: 'https://nrk.no' })
  })

  it('prepender https:// på www.-form og bruker det som href', () => {
    const result = splittPaaUrler('www.example.com')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      type: 'url',
      verdi: 'www.example.com',
      href: 'https://www.example.com',
    })
  })

  it('lar javascript:alert(1) forbli tekst — ingen lenke', () => {
    // URL_REGEX treffer kun http(s):// og www. — javascript: matcher ikke regex
    const result = splittPaaUrler('javascript:alert(1)')
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: 'tekst' })
  })

  it('trimmer trailing punktum fra URL', () => {
    const result = splittPaaUrler('se https://vg.no.')
    // result[0] = tekst 'se ', result[1] = url, result[2] = tekst '.'
    expect(result[1]).toMatchObject({ type: 'url', verdi: 'https://vg.no' })
    expect(result[2]).toMatchObject({ type: 'tekst', verdi: '.' })
  })
})
