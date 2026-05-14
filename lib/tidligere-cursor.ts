// Cursor-koding for paginering på /tidligere-siden.
// Siden blander tre element-typer (arrangementer, meldinger, polls) som
// hver pagineres uavhengig med keyset — en cursor inneholder én posisjon
// per type. null betyr «ingen cursor satt ennå» (hent fra toppen).
//
// Vi bruker base64url (ikke base64) for å slippe URL-escape av +/ i query
// strings. Buffer.from(..., 'base64url') er Node.js ≥ 14 og kjører trygt
// i Next.js server-kontekst.

export type TidligereCursor = {
  a: [string, string] | null  // arrangementer: [start_tidspunkt, id]
  m: [string, string] | null  // meldinger:    [sist_aktivitet, id]
  p: [string, string] | null  // polls:        [svarfrist, id]
}

export function enkodeCursor(c: TidligereCursor): string {
  return Buffer.from(JSON.stringify(c), 'utf8').toString('base64url')
}

export function dekodeCursor(s: string | undefined): TidligereCursor {
  if (!s) return { a: null, m: null, p: null }
  try {
    const obj = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'))
    // Valider at hver verdi enten er null eller et par av to strenger.
    // Sjekker typeof === 'string' for å hindre at f.eks. tall, objekter eller
    // null-elementer i array-en slipper gjennom og lager rar SQL-injeksjon-flate
    // eller knekker keyset-filteret nedstrøms.
    const erParAvStrenger = (v: unknown): v is [string, string] =>
      Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'string'
    return {
      a: erParAvStrenger(obj.a) ? obj.a : null,
      m: erParAvStrenger(obj.m) ? obj.m : null,
      p: erParAvStrenger(obj.p) ? obj.p : null,
    }
  } catch {
    // Ugyldig cursor — behandle som tom (start fra toppen)
    return { a: null, m: null, p: null }
  }
}
