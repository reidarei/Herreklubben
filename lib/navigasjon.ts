// Én sannhet for Chat-tab'ens omfang — brukes av både TopHeader (for å
// markere taben aktiv) og DraNedForOppdater (for å deaktivere pull-to-refresh
// på chat-ruter). Se #231 for bakgrunn.

export const CHAT_TAB_PREFIKSER = ['/chat', '/samtaler'] as const

/**
 * Returnerer true når pathname hører til Chat-taben.
 *
 * Bruker streng segment-grense (`/chat` eller `/chat/...`, ikke `/chatannet`)
 * fordi denne brukes til å DEAKTIVERE pull-to-refresh — en false positive
 * her ville stille fjerne funksjonalitet på en urelatert rute.
 *
 * TopHeader's `erAktiv()` bruker bevisst løsere prefix-matching for visuell
 * highlight: en feilaktig markert tab er en kosmetisk bagatell sammenliknet
 * med tap av pull-to-refresh, så asymmetrien er tilsiktet.
 */
export function erChatTab(pathname: string): boolean {
  return CHAT_TAB_PREFIKSER.some(
    p => pathname === p || pathname.startsWith(p + '/')
  )
}
