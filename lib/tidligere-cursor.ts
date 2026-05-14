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
    // Valider at hver verdi enten er null eller et par av to strenger
    return {
      a: Array.isArray(obj.a) && obj.a.length === 2 ? obj.a : null,
      m: Array.isArray(obj.m) && obj.m.length === 2 ? obj.m : null,
      p: Array.isArray(obj.p) && obj.p.length === 2 ? obj.p : null,
    }
  } catch {
    // Ugyldig cursor — behandle som tom (start fra toppen)
    return { a: null, m: null, p: null }
  }
}
