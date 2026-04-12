import { formatInTimeZone } from 'date-fns-tz'
import { nb } from 'date-fns/locale'

export const TIDSSONE = 'Europe/Oslo'

/**
 * Formater en ISO-dato i norsk tidssone (Europe/Oslo).
 * Håndterer sommer/vintertid automatisk.
 * Bruk denne overalt i stedet for date-fns format() — viktig fordi
 * serveren kjører i UTC (Dublin), og klienter kan være i andre tidssoner.
 */
export function formaterDato(iso: string, formatStr: string): string {
  return formatInTimeZone(new Date(iso), TIDSSONE, formatStr, { locale: nb })
}

/**
 * Returner "nå" som Date i norsk tidssone-kontekst.
 * Nyttig for sammenligninger som "er dette i dag?" der
 * "i dag" skal bety norsk dato, ikke UTC.
 */
export function norskDatoNaa(): Date {
  // Lag en dato-streng i norsk tidssone og parse den tilbake
  const norskNaa = formatInTimeZone(new Date(), TIDSSONE, 'yyyy-MM-dd', { locale: nb })
  const [y, m, d] = norskNaa.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Parse en ISO-dato til norsk dato (bare dag, uten klokkeslett).
 * Viktig for "er dette arrangement i dag?"-sjekker.
 */
export function norskDag(iso: string): Date {
  const norskStr = formatInTimeZone(new Date(iso), TIDSSONE, 'yyyy-MM-dd', { locale: nb })
  const [y, m, d] = norskStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Gjeldende år i norsk tidssone.
 * Viktig for server-side kode som kjører i UTC — på nyttårsaften
 * er det allerede nytt år i Oslo mens serveren fortsatt er i gammelt år.
 */
export function norskAar(): number {
  return parseInt(formatInTimeZone(new Date(), TIDSSONE, 'yyyy'))
}

/**
 * Konverter ISO-dato til datetime-local verdi i norsk tidssone.
 * Brukes for å pre-fylle <input type="datetime-local"> med riktig tid.
 */
export function isoTilDatetimeLocal(iso: string | null): string {
  if (!iso) return ''
  return formatInTimeZone(new Date(iso), TIDSSONE, "yyyy-MM-dd'T'HH:mm")
}

/**
 * Konverter datetime-local verdi til ISO (UTC).
 * datetime-local gir "2025-06-15T14:30" uten tidssone —
 * vi tolker det som norsk tid og konverterer til UTC.
 */
export function datetimeLocalTilIso(localStr: string): string {
  if (!localStr) return ''
  // Parse datoen som norsk tid ved å legge på tidssone-offset
  const norskIso = `${localStr}:00`
  // Bruk formatInTimeZone "baklengs": finn UTC-ekvivalenten
  // ved å lage en Date med riktig norsk tid
  const [datePart, timePart] = localStr.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [h, mi] = timePart.split(':').map(Number)

  // Bruk Intl for å finne offset for denne datoen i Europe/Oslo
  const testDate = new Date(Date.UTC(y, m - 1, d, h, mi))
  const osloStr = testDate.toLocaleString('en-US', { timeZone: TIDSSONE })
  const osloDate = new Date(osloStr)
  const offsetMs = osloDate.getTime() - testDate.getTime()

  // Lag riktig UTC-tid: norsk tid minus offset
  const utcDate = new Date(Date.UTC(y, m - 1, d, h, mi) - offsetMs)
  return utcDate.toISOString()
}
