'use server'

import { ensureInnlogget } from '@/lib/auth'
import { lastOppR2, slettR2, r2StiFraUrl } from '@/lib/r2'
import { arrangementBildeSti } from '@/lib/bilde-utils'

// Maksstørrelse mot R2 — komprimering på klienten skal holde filer godt
// under dette, men vi avviser eksplisitt for å unngå at store råfiler
// slipper gjennom hvis komprimering hoppes over.
const MAKS_BYTES = 5 * 1024 * 1024

// Tillatte MIME-typer. Klient-komprimering produserer alltid JPEG, men vi
// godtar et lite spillerom for å støtte rå-opplasting (f.eks. ny upload-
// flyt som ikke komprimerer enda).
const TILLATTE_TYPER = ['image/jpeg', 'image/png', 'image/webp']

// Last opp et arrangement-bilde til R2. Returnerer public URL.
// Kjører server-side — bruker auth-context til å bekrefte at kalleren er
// innlogget. Filnavn (sti) genereres på klienten via genererFilnavn().
export async function lastOppArrangementBilde(formData: FormData): Promise<{ url: string }> {
  await ensureInnlogget()

  const fil = formData.get('fil')
  const filnavn = formData.get('filnavn')

  if (!(fil instanceof File)) throw new Error('Mangler fil')
  if (typeof filnavn !== 'string' || !filnavn.trim()) throw new Error('Mangler filnavn')
  if (fil.size > MAKS_BYTES) throw new Error(`Filen er for stor (maks ${MAKS_BYTES / 1024 / 1024} MB)`)
  if (!TILLATTE_TYPER.includes(fil.type)) throw new Error('Ugyldig filtype')

  const data = new Uint8Array(await fil.arrayBuffer())
  const sti = arrangementBildeSti(filnavn)
  const url = await lastOppR2(sti, data, fil.type)

  return { url }
}

// Slett et arrangement-bilde fra R2 basert på public URL.
// Idempotent — feiler ikke hvis URL-en ikke peker til vår R2 eller filen
// allerede er borte.
export async function slettArrangementBilde(url: string | null): Promise<void> {
  if (!url) return
  await ensureInnlogget()
  const sti = r2StiFraUrl(url)
  if (!sti) return // ikke en R2-URL, hopp over
  await slettR2(sti)
}
