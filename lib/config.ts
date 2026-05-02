// Sentral applikasjons-konfigurasjon. All env-var-lesing og miljø-defaults
// skal samles her, ikke spres ut i actions/route handlers.

const PROD_URL = 'https://mortensrudherreklubb.no'
const DEV_URL = 'http://localhost:3000'

// Brukes i absolutte URL-er i varsler (push/epost), ICS-filer og lignende.
// Server-koden kan ikke lese window.location, så vi støtter en eksplisitt
// override via NEXT_PUBLIC_BASE_URL. Vercel setter automatisk VERCEL_URL
// for preview-deploys (uten protokoll), så vi prefikser den med https.
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NODE_ENV === 'production') return PROD_URL
  return DEV_URL
}

export const BASE_URL = getBaseUrl()

// Kontakt-epost for VAPID push-tjenestene (Apple/Google). Brukes ikke til
// å sende epost — kun metadata slik at push-tjenester kan kontakte oss
// ved misbruk eller tekniske problemer. Må være reell og nåbar.
export const VAPID_CONTACT_EMAIL =
  process.env.VAPID_CONTACT_EMAIL ?? 'reidar.haavik@gmail.com'
