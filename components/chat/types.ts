// Felles typer for chat-komponent og hooks.
// ChatScope er autoritativt definert i lib/chat-konfig.ts og re-eksporteres
// her for kall-ergonomi (eksisterende callsites importerer fra Chat.tsx).

export type { ChatScope } from '@/lib/chat-konfig'

export type ChatMelding = {
  id: string
  profil_id: string
  innhold: string | null
  bilde_url: string | null
  video_url: string | null
  opprettet: string
  // fra_facebook finnes kun på klubb_chat-tabellen — markerer meldinger
  // som er importert fra Messenger. Valgfritt så typen kan brukes i alle
  // chat-scopes uten å late som om feltet eksisterer overalt.
  fra_facebook?: boolean
}

export type Reaksjon = { melding_id: string; profil_id: string; emoji: string }
