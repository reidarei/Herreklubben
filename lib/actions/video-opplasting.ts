'use server'

import { ensureInnlogget } from '@/lib/auth'
import { lastOppR2, slettR2, r2StiFraUrl } from '@/lib/r2'
import { videoSti, VIDEO_KATEGORIER, type VideoKategori } from '@/lib/bilde-utils'

// Maksstørrelse for video. 50 MB rommer noen sekunder med høy bitrate eller
// et halvt minutt typisk mobilopptak. Vi avviser større filer eksplisitt
// for å unngå at urimelig store råfiler slipper gjennom.
const MAKS_BYTES = 50 * 1024 * 1024

// Tillatte MIME-typer. mp4 er standard, quicktime (.mov) er det iPhones
// produserer som standard. Andre formater (webm, avi, mkv) avvises.
const TILLATTE_TYPER = ['video/mp4', 'video/quicktime']

// Beltesele mot MIME-spoofing — sjekker også filendelsen i tillegg til
// Content-Type. Klienter kan lyge om MIME, men endelsen kommer fra
// faktisk filnavn vi selv har generert/akseptert.
const TILLATTE_EKSTENSJONER = ['mp4', 'mov']

function erKategori(v: unknown): v is VideoKategori {
  return typeof v === 'string' && (VIDEO_KATEGORIER as readonly string[]).includes(v)
}

function ekstensjon(filnavn: string): string {
  const idx = filnavn.lastIndexOf('.')
  if (idx < 0) return ''
  return filnavn.slice(idx + 1).toLowerCase()
}

// Last opp en video til R2 i gitt kategori. Returnerer public URL.
// FormData skal inneholde `fil`, `filnavn` og `kategori`. Filnavn genereres
// på klienten — server validerer kun at det finnes og har lovlig endelse.
export async function lastOppVideo(formData: FormData): Promise<{ url: string }> {
  try {
    await ensureInnlogget()

    const fil = formData.get('fil')
    const filnavn = formData.get('filnavn')
    const kategori = formData.get('kategori')

    if (!(fil instanceof File)) throw new Error('Mangler fil')
    if (typeof filnavn !== 'string' || !filnavn.trim()) throw new Error('Mangler filnavn')
    if (!erKategori(kategori)) throw new Error('Ugyldig kategori')
    if (fil.size > MAKS_BYTES) throw new Error('Filen er for stor (maks 50 MB)')
    if (!TILLATTE_TYPER.includes(fil.type)) throw new Error('Ugyldig filtype')
    if (!TILLATTE_EKSTENSJONER.includes(ekstensjon(filnavn))) throw new Error('Ugyldig filendelse')

    const data = new Uint8Array(await fil.arrayBuffer())
    const sti = videoSti(kategori, filnavn)
    const url = await lastOppR2(sti, data, fil.type)

    return { url }
  } catch (err) {
    console.error('[video-opplasting] feil:', err)
    const melding = err instanceof Error ? err.message : 'Ukjent feil ved opplasting'
    throw new Error(`Opplasting feilet: ${melding}`)
  }
}

// Slett en R2-video basert på public URL.
// Idempotent — feiler ikke hvis URL-en ikke peker til vår R2 eller filen
// allerede er borte. Eldre Supabase-URL-er passerer uberørt.
export async function slettVideo(url: string | null): Promise<void> {
  if (!url) return
  await ensureInnlogget()
  const sti = r2StiFraUrl(url)
  if (!sti) return // ikke en R2-URL, hopp over
  await slettR2(sti)
}
