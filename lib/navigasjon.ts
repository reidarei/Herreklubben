// Én sannhet for Chat-tab'ens omfang — brukes av både TopHeader (for å
// markere taben aktiv) og DraNedForOppdater (for å deaktivere pull-to-refresh
// på chat-ruter). Se #231 for bakgrunn.

export const CHAT_TAB_PREFIKSER = ['/chat', '/samtaler'] as const

/** Returnerer true når pathname hører til Chat-taben. */
export function erChatTab(pathname: string): boolean {
  return CHAT_TAB_PREFIKSER.some(
    p => pathname === p || pathname.startsWith(p + '/')
  )
}
