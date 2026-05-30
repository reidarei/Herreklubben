'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  sendChatMelding,
  oppdaterChatMelding,
  slettChatMelding,
  leggTilReaksjon,
  fjernReaksjon,
} from '@/lib/actions/chat'
import { konfigFor, type ChatScope } from '@/lib/chat-konfig'
import { komprimer, genererFilnavn } from '@/lib/bilde-utils'
import { lastOppBilde, slettBilde } from '@/lib/actions/bilde-opplasting'
import type { ChatMelding, Reaksjon } from '../types'

// Antall meldinger som lastes first-batch og per "Vis eldre"-klikk
const SIDE_STORRELSE = 30

type UseChatDataProps = {
  scope: ChatScope
  brukerId: string
  initialMeldinger: ChatMelding[]
}

type UseChatDataReturn = {
  meldinger: ChatMelding[]
  reaksjoner: Reaksjon[]
  reaksjonerPerMelding: Map<string, Reaksjon[]>
  harMerEldre: boolean
  henterEldre: boolean
  lastEldre: () => Promise<void>
  send: (innhold: string | null, bildeFil: File | null, bildePreviewUrl: string | null) => Promise<void>
  slett: (id: string) => Promise<void>
  redigerMelding: (id: string, nyTekst: string) => Promise<void>
  toggleReaksjon: (meldingId: string, emoji: string) => Promise<void>
  konfig: ReturnType<typeof konfigFor>
}

export function useChatData({ scope, brukerId, initialMeldinger }: UseChatDataProps): UseChatDataReturn {
  // initialMeldinger kommer som de siste N meldingene i stigende rekkefølge
  const [meldinger, setMeldinger] = useState<ChatMelding[]>(initialMeldinger)
  const [harMerEldre, setHarMerEldre] = useState(initialMeldinger.length >= SIDE_STORRELSE)
  const [henterEldre, setHenterEldre] = useState(false)

  // Reaksjoner — flat liste hentet fra chat_reaksjoner. Grupperes per melding
  // i render. En Map er raskere for hot-paths men flat liste er lettere å
  // oppdatere atomisk via realtime.
  const [reaksjoner, setReaksjoner] = useState<Reaksjon[]>([])

  const supabase = useRef(createClient()).current

  // CHAT_KONFIG-lookup samler tabell/kanal/charLimit per scope. Erstatter
  // 5 paralle switch-kjeder som tidligere måtte holdes synk her, i hentMeldinger,
  // i realtime-oppsett og i input-validering.
  const konfig = konfigFor(scope)
  const tabell = konfig.tabell
  const kanalNavn = konfig.kanalNavn(scope)

  // Ekstraherte scope-felter — flate verdier slik at react-hooks/exhaustive-deps
  // kan analysere deps-arrayene under uten "complex expression"-warnings.
  const scopeType = scope.type
  const arrangementId = scope.type === 'arrangement' ? scope.arrangementId : ''
  const pollId = scope.type === 'poll' ? scope.pollId : ''
  const meldingId = scope.type === 'melding' ? scope.meldingId : ''
  const samtaleId = scope.type === 'privat' ? scope.samtaleId : ''

  // Helper — henter meldinger med riktig scope-filter. Returnerer i
  // *stigende* rekkefølge (eldste først) siden det er det UI-et ønsker.
  // Bruker CHAT_KONFIG til å slå opp tabell + FK-filter — ingen scope-
  // spesifikke grener her.
  const hentMeldinger = useCallback(
    async (forTidspunkt?: string): Promise<ChatMelding[]> => {
      // klubb_chat har i tillegg `fra_facebook` for å vise Messenger-badge på
      // historisk-importerte meldinger. Andre chat-tabeller har ikke kolonnen.
      // UPDATE-handleren (under) tar bevisst kun innhold, så endring av
      // fra_facebook på en eksisterende rad slår ikke gjennom i UI — i
      // praksis er flagget skrivebeskyttet etter import.
      const select =
        tabell === 'klubb_chat'
          ? 'id, profil_id, innhold, bilde_url, video_url, opprettet, fra_facebook'
          : 'id, profil_id, innhold, bilde_url, video_url, opprettet'
      let q = supabase
        .from(konfig.tabell)
        .select(select)
        .order('opprettet', { ascending: false })
        .limit(SIDE_STORRELSE)
      const fkVerdi = konfig.scopeId(scope)
      if (konfig.fkFelt && fkVerdi) {
        q = q.eq(konfig.fkFelt, fkVerdi)
      }
      if (forTidspunkt) q = q.lt('opprettet', forTidspunkt)
      const { data } = await q
      return data ? ([...data].reverse() as unknown as ChatMelding[]) : []
    },
    // konfig/scope/tabell utelates bevisst — de er rent utledet av scope-feltene over,
    // og parent sender inline scope-objekter (ny identitet per render) som ville trigget
    // unødvendige re-fetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopeType, arrangementId, pollId, meldingId, samtaleId, supabase],
  )

  // Realtime-subscription — én kanal per scope
  useEffect(() => {
    let cancelled = false

    async function startSubscription() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled || !session) return

      supabase.realtime.setAuth(session.access_token)

      const channel = supabase.channel(kanalNavn)

      // Filter på FK-kolonnen hvis scope har en (alle utenom klubb).
      const fkVerdi = konfig.scopeId(scope)
      const insertConfig =
        konfig.fkFelt && fkVerdi
          ? {
              event: 'INSERT' as const,
              schema: 'public',
              table: tabell,
              filter: `${konfig.fkFelt}=eq.${fkVerdi}`,
            }
          : { event: 'INSERT' as const, schema: 'public', table: tabell }

      const deleteConfig = { event: 'DELETE' as const, schema: 'public', table: tabell }
      const updateConfig = { event: 'UPDATE' as const, schema: 'public', table: tabell }

      channel
        .on('postgres_changes', insertConfig, payload => {
          const ny = payload.new as ChatMelding
          setMeldinger(prev => {
            if (prev.some(m => m.id === ny.id)) return prev
            // Fjern KUN ÉN matching temp-rad (eldste først), så samme melding
            // sendt to ganger på rad ikke fører til at begge temp-rader
            // forsvinner ved første INSERT.
            const tempIdx = prev.findIndex(
              m =>
                m.id.startsWith('temp-') &&
                m.profil_id === ny.profil_id &&
                m.innhold === ny.innhold,
            )
            const utenTemp =
              tempIdx === -1 ? prev : prev.filter((_, i) => i !== tempIdx)
            // Frigjør blob-URL fra temp-raden hvis den hadde en
            if (tempIdx !== -1) {
              const fjernet = prev[tempIdx]
              if (fjernet.bilde_url?.startsWith('blob:')) {
                URL.revokeObjectURL(fjernet.bilde_url)
              }
            }
            return [...utenTemp, ny]
          })
        })
        .on('postgres_changes', deleteConfig, payload => {
          const slettetId = (payload.old as { id: string }).id
          setMeldinger(prev => prev.filter(m => m.id !== slettetId))
        })
        .on('postgres_changes', updateConfig, payload => {
          const oppdatert = payload.new as ChatMelding
          setMeldinger(prev =>
            prev.map(m => (m.id === oppdatert.id ? { ...m, innhold: oppdatert.innhold } : m)),
          )
        })
        .subscribe()

      return channel
    }

    let channelRef: ReturnType<typeof supabase.channel> | undefined
    startSubscription().then(ch => {
      channelRef = ch
    })

    return () => {
      cancelled = true
      if (channelRef) supabase.removeChannel(channelRef)
    }
    // kanalNavn/konfig/scope/tabell utelates bevisst — alle utledet av scope-feltene over,
    // og parent sender inline scope-objekter (ny identitet per render) som ville trigget
    // unødvendige re-subscribes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeType, arrangementId, pollId, meldingId, samtaleId, supabase])

  // Hent reaksjoner — kun for meldings-ID-er vi ikke har hentet før. På
  // mount: fetch for alle. Ved scrollback (Vis eldre): fetch for nye
  // gamle IDer. Når en ny melding kommer inn via send/realtime: fetcher
  // for den ene IDen — typisk 0 rader, men billig og holder logikken
  // homogen. Realtime-subscription under fanger nye reaksjoner uansett.
  //
  // Tidligere mønster fetch'et HELE settet hver gang meldinger.length
  // endret seg, og erstattet reaksjons-state komplett → re-render av
  // alle chat-bobler. Det dro INP merkbart.
  const fetchedReaksjonsIder = useRef(new Set<string>())
  useEffect(() => {
    const synlige = meldinger.map(m => m.id).filter(id => !id.startsWith('temp-'))
    const nye = synlige.filter(id => !fetchedReaksjonsIder.current.has(id))
    if (nye.length === 0) return
    for (const id of nye) fetchedReaksjonsIder.current.add(id)

    let cancelled = false
    supabase
      .from('chat_reaksjoner')
      .select('melding_id, profil_id, emoji')
      .in('melding_id', nye)
      .then(({ data }) => {
        if (cancelled || !data || data.length === 0) return
        setReaksjoner(prev => {
          // Slå sammen — fjerne dubletter for samme (melding_id, profil_id, emoji)
          const eksisterende = new Set(
            prev.map(r => `${r.melding_id}|${r.profil_id}|${r.emoji}`),
          )
          const nye = (data as Reaksjon[]).filter(
            r => !eksisterende.has(`${r.melding_id}|${r.profil_id}|${r.emoji}`),
          )
          return nye.length > 0 ? [...prev, ...nye] : prev
        })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meldinger.length])

  // Reaksjoner gruppert per melding_id — kalkuleres én gang per
  // render, ikke i hver boble. Sparer O(N×R) → O(N+R) når N meldinger
  // og R reaksjoner.
  const reaksjonerPerMelding = useMemo(() => {
    const map = new Map<string, Reaksjon[]>()
    for (const r of reaksjoner) {
      const liste = map.get(r.melding_id)
      if (liste) liste.push(r)
      else map.set(r.melding_id, [r])
    }
    return map
  }, [reaksjoner])

  // Realtime for reaksjoner — egen kanal siden vi ikke har filter per scope
  // (reaksjoner har ingen scope-kolonne; vi stoler på at bare synlige meldinger
  // får reaksjoner oppdatert via postfiltering).
  useEffect(() => {
    let cancelled = false
    let channelRef: ReturnType<typeof supabase.channel> | undefined

    async function start() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled || !session) return
      supabase.realtime.setAuth(session.access_token)

      const channel = supabase.channel('chat-reaksjoner')
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_reaksjoner' },
          payload => {
            const ny = payload.new as Reaksjon
            setReaksjoner(prev => {
              if (prev.some(r =>
                r.melding_id === ny.melding_id &&
                r.profil_id === ny.profil_id &&
                r.emoji === ny.emoji
              )) return prev
              return [...prev, ny]
            })
          },
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'chat_reaksjoner' },
          payload => {
            const gml = payload.old as Partial<Reaksjon>
            setReaksjoner(prev =>
              prev.filter(r =>
                !(
                  r.melding_id === gml.melding_id &&
                  r.profil_id === gml.profil_id &&
                  r.emoji === gml.emoji
                ),
              ),
            )
          },
        )
        .subscribe()
      channelRef = channel
    }

    start()
    return () => {
      cancelled = true
      if (channelRef) supabase.removeChannel(channelRef)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch ved visibilitychange (iOS PWA dropper WebSocket i bakgrunnen).
  // Henter de siste SIDE_STORRELSE for å fylle manglende meldinger.
  useEffect(() => {
    async function reFetch() {
      if (document.visibilityState !== 'visible') return
      const nyeste = await hentMeldinger()
      if (nyeste.length === 0) return
      setMeldinger(prev => {
        // Behold eventuelle eldre meldinger brukeren allerede har lastet
        const eldste = nyeste[0].opprettet
        const eldre = prev.filter(m => m.opprettet < eldste)
        return [...eldre, ...nyeste]
      })
    }

    document.addEventListener('visibilitychange', reFetch)
    return () => document.removeEventListener('visibilitychange', reFetch)
  }, [hentMeldinger])

  async function lastEldre() {
    if (henterEldre || !harMerEldre || meldinger.length === 0) return
    setHenterEldre(true)
    try {
      const eldstKjentTid = meldinger[0].opprettet
      const eldre = await hentMeldinger(eldstKjentTid)
      if (eldre.length > 0) {
        setMeldinger(prev => [...eldre, ...prev])
      }
      if (eldre.length < SIDE_STORRELSE) setHarMerEldre(false)
    } finally {
      setHenterEldre(false)
    }
  }

  async function send(innhold: string | null, bildeFil: File | null, bildePreviewUrl: string | null) {
    const harBilde = !!bildeFil
    if (!innhold && !harBilde) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const optimistisk: ChatMelding = {
      id: tempId,
      profil_id: brukerId,
      innhold,
      bilde_url: bildePreviewUrl, // viser blob-URL midlertidig
      video_url: null,
      opprettet: new Date().toISOString(),
      fra_facebook: false,
    }
    setMeldinger(prev => [...prev, optimistisk])

    const filUploadKopi = bildeFil
    const previewUrlKopi = bildePreviewUrl

    let bildeUrl: string | null = null
    try {
      // Last opp bilde til R2 først hvis valgt
      if (filUploadKopi) {
        const fd = new FormData()
        fd.append('fil', filUploadKopi)
        fd.append('filnavn', genererFilnavn(filUploadKopi))
        fd.append('kategori', 'chat')
        const res = await lastOppBilde(fd)
        bildeUrl = res.url
      }

      await sendChatMelding(scope, innhold, bildeUrl)
    } catch (err) {
      console.error('Send feilet:', err)
      setMeldinger(prev => prev.filter(m => m.id !== tempId))
      // Rydd opp R2-fil hvis upload lyktes men insert feilet (best effort —
      // bedre å ha en orphan enn å feile uten tilbakemelding).
      if (bildeUrl) slettBilde(bildeUrl).catch(() => {})
      // Frigjør blob-URL siden den optimistiske raden ble fjernet
      if (previewUrlKopi) URL.revokeObjectURL(previewUrlKopi)
      throw err // kaster videre så Chat.tsx kan sette feilmelding
    }
    // Merk: blob-URL beholdes ved suksess til realtime INSERT bytter ut
    // optimistisk-raden. Cleanup skjer i useEffect under når raden er borte.
  }

  async function slett(id: string) {
    setMeldinger(prev => prev.filter(m => m.id !== id))
    try {
      await slettChatMelding(scope, id)
    } catch {
      // Ved feil: last inn de siste N på nytt
      const nyeste = await hentMeldinger()
      setMeldinger(nyeste)
    }
  }

  async function redigerMelding(id: string, nyTekst: string) {
    // Ta vare på gammel tekst for rollback
    const meldingFoer = meldinger.find(m => m.id === id)
    // Optimistisk oppdatering
    setMeldinger(prev => prev.map(m => (m.id === id ? { ...m, innhold: nyTekst } : m)))
    try {
      await oppdaterChatMelding(scope, id, nyTekst)
    } catch {
      // Rull tilbake ved feil
      if (meldingFoer) {
        setMeldinger(prev =>
          prev.map(m => (m.id === id ? { ...m, innhold: meldingFoer.innhold } : m)),
        )
      }
      throw new Error('oppdater feilet')
    }
  }

  async function toggleReaksjon(meldingId: string, emoji: string) {
    const alleredePaa = reaksjoner.some(
      r => r.melding_id === meldingId && r.profil_id === brukerId && r.emoji === emoji,
    )
    // Optimistisk oppdatering
    if (alleredePaa) {
      setReaksjoner(prev =>
        prev.filter(
          r => !(r.melding_id === meldingId && r.profil_id === brukerId && r.emoji === emoji),
        ),
      )
    } else {
      setReaksjoner(prev => [
        ...prev,
        { melding_id: meldingId, profil_id: brukerId, emoji },
      ])
    }

    try {
      if (alleredePaa) {
        await fjernReaksjon(meldingId, emoji)
      } else {
        await leggTilReaksjon(meldingId, emoji)
      }
    } catch {
      // Rollback ved feil
      if (alleredePaa) {
        setReaksjoner(prev => [
          ...prev,
          { melding_id: meldingId, profil_id: brukerId, emoji },
        ])
      } else {
        setReaksjoner(prev =>
          prev.filter(
            r => !(r.melding_id === meldingId && r.profil_id === brukerId && r.emoji === emoji),
          ),
        )
      }
    }
  }

  return {
    meldinger,
    reaksjoner,
    reaksjonerPerMelding,
    harMerEldre,
    henterEldre,
    lastEldre,
    send,
    slett,
    redigerMelding,
    toggleReaksjon,
    konfig,
  }
}
