'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  sendMelding,
  slettMelding,
  oppdaterMelding,
  sendKlubbMelding,
  slettKlubbMelding,
  oppdaterKlubbMelding,
  sendPollMelding,
  slettPollMelding,
  oppdaterPollMelding,
  sendMeldingKommentar,
  slettMeldingKommentar,
  oppdaterMeldingKommentar,
  leggTilReaksjon,
  fjernReaksjon,
} from '@/lib/actions/chat'
import {
  sendPrivatMelding,
  slettPrivatMelding,
  oppdaterPrivatMelding,
} from '@/lib/actions/samtaler'
import { formaterDato } from '@/lib/dato'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import SectionLabel from '@/components/ui/SectionLabel'
import BildeLightbox from '@/components/ui/BildeLightbox'
import { komprimer, genererFilnavn } from '@/lib/bilde-utils'
import { lastOppBilde, slettBilde } from '@/lib/actions/bilde-opplasting'
import { CHAT_MAKS_LENGDE } from '@/lib/konstanter'
import { INNLEGG_MAKS_LENGDE } from '@/lib/konstanter'

export type ChatScope =
  | { type: 'arrangement'; arrangementId: string }
  | { type: 'klubb' }
  | { type: 'poll'; pollId: string }
  | { type: 'melding'; meldingId: string }
  | { type: 'privat'; samtaleId: string }

export type ChatMelding = {
  id: string
  profil_id: string
  innhold: string | null
  bilde_url: string | null
  opprettet: string
}

export type ChatProfil = {
  id: string
  navn: string | null
  bilde_url: string | null
  rolle?: string | null
}

// Antall meldinger som lastes first-batch og per "Vis eldre"-klikk
const SIDE_STORRELSE = 30

// Emojis tilgjengelige i reaksjons-picker
const REAKSJON_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '🙌'] as const

type Reaksjon = { melding_id: string; profil_id: string; emoji: string }

function renderMedMentions(tekst: string | null) {
  if (!tekst) return null
  const deler = tekst.split(/(@[\wæøåÆØÅ][\w æøåÆØÅ-]*)/g)
  return deler.map((del, i) =>
    del.startsWith('@') ? (
      <span key={i} style={{ fontWeight: 600, color: 'var(--accent)' }}>
        {del}
      </span>
    ) : (
      del
    ),
  )
}

type Props = {
  scope: ChatScope
  brukerId: string
  erAdmin: boolean
  initialMeldinger: ChatMelding[]
  profiler: ChatProfil[]
  /** Hvis true: sett en overskrift ("Samtale") over chat-området */
  visSeksjonsLabel?: boolean
}

export default function Chat({
  scope,
  brukerId,
  erAdmin,
  initialMeldinger,
  profiler,
  visSeksjonsLabel = true,
}: Props) {
  // initialMeldinger kommer som de siste N meldingene i stigende rekkefølge
  const [meldinger, setMeldinger] = useState<ChatMelding[]>(initialMeldinger)
  const [harMerEldre, setHarMerEldre] = useState(initialMeldinger.length >= SIDE_STORRELSE)
  const [henterEldre, setHenterEldre] = useState(false)

  const [tekst, setTekst] = useState('')
  const [sender, setSender] = useState(false)
  const [mentionSøk, setMentionSøk] = useState<string | null>(null)
  // Vedheng-bilde (file holdes til submit, lastes opp først ved send)
  const [bildeFil, setBildeFil] = useState<File | null>(null)
  const [bildePreview, setBildePreview] = useState<string | null>(null)
  const [bildeFeil, setBildeFeil] = useState('')
  const bildeInputRef = useRef<HTMLInputElement>(null)
  // Lightbox-visning av bilder
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  // Reaksjoner — flat liste hentet fra chat_reaksjoner. Grupperes per melding
  // i render. En Map er raskere for hot-paths men flat liste er lettere å
  // oppdatere atomisk via realtime.
  const [reaksjoner, setReaksjoner] = useState<Reaksjon[]>([])
  // Hvilken melding viser picker. Null = ingen.
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  // Hvilken melding redigeres. Null = ingen. editTekst holder editert innhold.
  const [editerer, setEditerer] = useState<string | null>(null)
  const [editTekst, setEditTekst] = useState('')
  const [lagrerEdit, setLagrerEdit] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const bunnenRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const profilMap = useRef(
    new Map(profiler.map(p => [p.id, p.navn ?? 'Ukjent'])),
  ).current
  const bildeMap = useRef(
    new Map(profiler.map(p => [p.id, p.bilde_url])),
  ).current
  const rolleMap = useRef(
    new Map(profiler.map(p => [p.id, p.rolle ?? null])),
  ).current
  const andreProfiler = useRef(
    profiler.filter(p => p.id !== brukerId && p.navn),
  ).current
  const supabase = useRef(createClient()).current

  const tabell =
    scope.type === 'klubb'
      ? 'klubb_chat'
      : scope.type === 'poll'
        ? 'poll_chat'
        : scope.type === 'melding'
          ? 'melding_chat'
          : scope.type === 'privat'
            ? 'samtale_chat'
            : 'arrangement_chat'
  const kanalNavn =
    scope.type === 'klubb'
      ? 'chat-klubb'
      : scope.type === 'poll'
        ? `chat-poll-${scope.pollId}`
        : scope.type === 'melding'
          ? `chat-melding-${scope.meldingId}`
          : scope.type === 'privat'
            ? `chat-privat-${scope.samtaleId}`
            : `chat-arr-${scope.arrangementId}`

  // Helper — henter meldinger med riktig scope-filter. Returnerer i
  // *stigende* rekkefølge (eldste først) siden det er det UI-et ønsker.
  const hentMeldinger = useCallback(
    async (forTidspunkt?: string): Promise<ChatMelding[]> => {
      if (scope.type === 'klubb') {
        let q = supabase
          .from('klubb_chat')
          .select('id, profil_id, innhold, bilde_url, opprettet')
          .order('opprettet', { ascending: false })
          .limit(SIDE_STORRELSE)
        if (forTidspunkt) q = q.lt('opprettet', forTidspunkt)
        const { data } = await q
        return data ? [...data].reverse() : []
      }
      if (scope.type === 'poll') {
        let q = supabase
          .from('poll_chat')
          .select('id, profil_id, innhold, bilde_url, opprettet')
          .eq('poll_id', scope.pollId)
          .order('opprettet', { ascending: false })
          .limit(SIDE_STORRELSE)
        if (forTidspunkt) q = q.lt('opprettet', forTidspunkt)
        const { data } = await q
        return data ? [...data].reverse() : []
      }
      if (scope.type === 'melding') {
        let q = supabase
          .from('melding_chat')
          .select('id, profil_id, innhold, bilde_url, opprettet')
          .eq('melding_id', scope.meldingId)
          .order('opprettet', { ascending: false })
          .limit(SIDE_STORRELSE)
        if (forTidspunkt) q = q.lt('opprettet', forTidspunkt)
        const { data } = await q
        return data ? [...data].reverse() : []
      }
      if (scope.type === 'privat') {
        let q = supabase
          .from('samtale_chat')
          .select('id, profil_id, innhold, bilde_url, opprettet')
          .eq('samtale_id', scope.samtaleId)
          .order('opprettet', { ascending: false })
          .limit(SIDE_STORRELSE)
        if (forTidspunkt) q = q.lt('opprettet', forTidspunkt)
        const { data } = await q
        return data ? [...data].reverse() : []
      }
      let q = supabase
        .from('arrangement_chat')
        .select('id, profil_id, innhold, bilde_url, opprettet')
        .eq('arrangement_id', scope.arrangementId)
        .order('opprettet', { ascending: false })
        .limit(SIDE_STORRELSE)
      if (forTidspunkt) q = q.lt('opprettet', forTidspunkt)
      const { data } = await q
      return data ? [...data].reverse() : []
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      scope.type,
      scope.type === 'arrangement' ? scope.arrangementId : '',
      scope.type === 'poll' ? scope.pollId : '',
      scope.type === 'melding' ? scope.meldingId : '',
      scope.type === 'privat' ? scope.samtaleId : '',
      supabase,
    ],
  )

  // Frigjør blob-URL når preview byttes
  useEffect(() => {
    return () => {
      if (bildePreview) URL.revokeObjectURL(bildePreview)
    }
  }, [bildePreview])

  async function velgBilde(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    if (!fil) return
    setBildeFeil('')
    try {
      const komprimert = await komprimer(fil)
      setBildeFil(komprimert)
      if (bildePreview) URL.revokeObjectURL(bildePreview)
      setBildePreview(URL.createObjectURL(komprimert))
    } catch (err) {
      setBildeFeil(err instanceof Error ? err.message : 'Kunne ikke lese bildet')
    } finally {
      if (bildeInputRef.current) bildeInputRef.current.value = ''
    }
  }

  function fjernBilde() {
    setBildeFil(null)
    if (bildePreview) URL.revokeObjectURL(bildePreview)
    setBildePreview(null)
    setBildeFeil('')
  }

  // @alle er et spesialvalg som trigger varsel til alle aktive profiler.
  // Server-siden matcher strengen «alle» direkte og sender varsler bredt.
  const ALLE_VALG: ChatProfil = {
    id: '__alle__',
    navn: 'alle',
    bilde_url: null,
    rolle: null,
  }
  const mentionForslag =
    mentionSøk !== null
      ? [
          ...('alle'.startsWith(mentionSøk.toLowerCase()) ? [ALLE_VALG] : []),
          ...andreProfiler
            .filter(p => p.navn!.toLowerCase().includes(mentionSøk.toLowerCase()))
            .slice(0, 5),
        ]
      : []

  function oppdaterMentionSøk(verdi: string) {
    const sisteAt = verdi.lastIndexOf('@')
    if (sisteAt === -1) {
      setMentionSøk(null)
      return
    }
    const etterAt = verdi.slice(sisteAt + 1)
    if (etterAt.endsWith('  ') || etterAt.includes('\n')) {
      setMentionSøk(null)
      return
    }
    setMentionSøk(etterAt)
  }

  function velgMention(navn: string) {
    const sisteAt = tekst.lastIndexOf('@')
    if (sisteAt === -1) return
    const nyTekst = tekst.slice(0, sisteAt) + '@' + navn + ' '
    setTekst(nyTekst)
    setMentionSøk(null)
    inputRef.current?.focus()
  }

  const scrollTilBunn = useCallback((instant = false) => {
    // scrollIntoView legger elementet ved viewport-bunnen, men der ligger
    // docken (fixed) oppå — så meldingen blir skjult bak. Vi scroller
    // i stedet hele siden helt nederst. Input-pillet under bunnenRef gir
    // naturlig avstand mellom siste melding og docken.
    if (typeof window === 'undefined') return
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: instant ? 'auto' : 'smooth',
    })
  }, [])

  // Scroll til bunn ved første mount (instant), og når nye meldinger
  // dukker opp i bunnen (smooth). Ikke ved paginering (store diff)
  // eller når listen krymper.
  const forrigeLengde = useRef(meldinger.length)
  const harMountet = useRef(false)
  useEffect(() => {
    const lengdeForDenneEffekten = meldinger.length
    const diff = lengdeForDenneEffekten - forrigeLengde.current
    forrigeLengde.current = lengdeForDenneEffekten

    if (!harMountet.current) {
      harMountet.current = true
      // requestAnimationFrame så DOM er rendret før vi måler/scroller
      requestAnimationFrame(() => scrollTilBunn(true))
      return
    }
    // Bare scroll hvis nye meldinger dukker opp i bunnen (positive diff <= 3)
    if (diff > 0 && diff <= 3) scrollTilBunn()
  }, [meldinger.length, scrollTilBunn])

  // Skjul bottom-nav når tastaturet er åpent på mobil. Vi krever BÅDE
  // at viewport er smalere (visualViewport) OG at en chat-input er
  // fokusert — slik at swipe-back-gesten på iOS som transient krymper
  // viewporten ikke trigger feilaktig.
  //
  // Tidligere brukte vi bare visualViewport, men da blir docken hengende
  // skjult når brukeren sveiper tilbake fra en chat-side: iOS endrer
  // viewport-høyde under animasjonen, og hvis cleanup ikke rekker å
  // kjøre i tide blir klassen liggende.
  useEffect(() => {
    const KLASSE = 'chat-input-fokus'
    const html = document.documentElement
    const vv = typeof window !== 'undefined' ? window.visualViewport : null

    function settKlasse(synlig: boolean) {
      if (synlig) html.classList.add(KLASSE)
      else html.classList.remove(KLASSE)
    }

    function chatInputErFokusert(): boolean {
      const aktiv = document.activeElement
      return !!aktiv && aktiv instanceof HTMLElement && aktiv.dataset.chatInput === 'true'
    }

    function vurder() {
      if (!vv) return
      const ratio = vv.height / window.innerHeight
      // Hvis chat-input ikke er fokusert har vi ingen grunn til å skjule
      // docken — selv om viewport-en av en eller annen grunn er smalere
      // (swipe-overgang, system-prompt, osv).
      settKlasse(ratio < 0.85 && chatInputErFokusert())
    }

    if (vv) {
      vv.addEventListener('resize', vurder)
      // focusin/focusout fyrer på document-nivå når fokus endres på
      // ethvert element under — vi reagerer slik at klassen kommer på/av
      // umiddelbart ved fokus-bytte, ikke bare ved viewport-endringer.
      document.addEventListener('focusin', vurder)
      document.addEventListener('focusout', vurder)
      vurder()
    } else {
      // Fallback (svært gamle nettlesere): hold fokus/blur-mønsteret
      const input = inputRef.current
      function handleFocus() { settKlasse(true) }
      function handleBlur() { settKlasse(false) }
      input?.addEventListener('focus', handleFocus)
      input?.addEventListener('blur', handleBlur)
      return () => {
        input?.removeEventListener('focus', handleFocus)
        input?.removeEventListener('blur', handleBlur)
        settKlasse(false)
      }
    }

    // pagehide fyrer når siden faktisk skjules (også ved iOS swipe-back),
    // mens unmount-cleanup kan bli forsinket av animasjonen. Defense-in-
    // depth for issue #99 — sammen med DockOpprydder i app/(app)/layout.tsx.
    function ryddVedSkjult() {
      settKlasse(false)
    }
    window.addEventListener('pagehide', ryddVedSkjult)

    return () => {
      vv?.removeEventListener('resize', vurder)
      document.removeEventListener('focusin', vurder)
      document.removeEventListener('focusout', vurder)
      window.removeEventListener('pagehide', ryddVedSkjult)
      settKlasse(false)
    }
  }, [])

  // Realtime-subscription — én kanal per scope
  useEffect(() => {
    let cancelled = false

    async function startSubscription() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled || !session) return

      supabase.realtime.setAuth(session.access_token)

      const channel = supabase.channel(kanalNavn)

      // Filter: for arrangement/poll, filtrer på respektive id. For klubb,
      // ingen filter siden tabellen kun inneholder klubb-meldinger.
      const insertConfig =
        scope.type === 'arrangement'
          ? {
              event: 'INSERT' as const,
              schema: 'public',
              table: tabell,
              filter: `arrangement_id=eq.${scope.arrangementId}`,
            }
          : scope.type === 'poll'
            ? {
                event: 'INSERT' as const,
                schema: 'public',
                table: tabell,
                filter: `poll_id=eq.${scope.pollId}`,
              }
            : scope.type === 'melding'
              ? {
                  event: 'INSERT' as const,
                  schema: 'public',
                  table: tabell,
                  filter: `melding_id=eq.${scope.meldingId}`,
                }
              : scope.type === 'privat'
                ? {
                    event: 'INSERT' as const,
                    schema: 'public',
                    table: tabell,
                    filter: `samtale_id=eq.${scope.samtaleId}`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scope.type,
    scope.type === 'arrangement' ? scope.arrangementId : '',
    scope.type === 'poll' ? scope.pollId : '',
    scope.type === 'melding' ? scope.meldingId : '',
    scope.type === 'privat' ? scope.samtaleId : '',
    supabase,
  ])

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

  async function handleSend() {
    const melding = tekst.trim() || null
    const harBilde = !!bildeFil
    if (!melding && !harBilde) return
    if (sender) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const optimistisk: ChatMelding = {
      id: tempId,
      profil_id: brukerId,
      innhold: melding,
      bilde_url: bildePreview, // viser blob-URL midlertidig
      opprettet: new Date().toISOString(),
    }
    setMeldinger(prev => [...prev, optimistisk])

    setTekst('')
    setMentionSøk(null)
    setSender(true)
    const filUploadKopi = bildeFil
    const previewUrlKopi = bildePreview
    setBildeFil(null)
    setBildePreview(null) // ikke revoke ennå — optimistisk rad bruker den

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

      if (scope.type === 'arrangement') {
        await sendMelding(scope.arrangementId, melding, bildeUrl)
      } else if (scope.type === 'poll') {
        await sendPollMelding(scope.pollId, melding, bildeUrl)
      } else if (scope.type === 'melding') {
        await sendMeldingKommentar(scope.meldingId, melding, bildeUrl)
      } else if (scope.type === 'privat') {
        await sendPrivatMelding(scope.samtaleId, melding, bildeUrl)
      } else {
        await sendKlubbMelding(melding, bildeUrl)
      }
    } catch (err) {
      console.error('Send feilet:', err)
      setMeldinger(prev => prev.filter(m => m.id !== tempId))
      setBildeFeil('Kunne ikke sende meldingen')
      // Rydd opp R2-fil hvis upload lyktes men insert feilet (best effort —
      // bedre å ha en orphan enn å feile uten tilbakemelding).
      if (bildeUrl) slettBilde(bildeUrl).catch(() => {})
      // Frigjør blob-URL siden den optimistiske raden ble fjernet
      if (previewUrlKopi) URL.revokeObjectURL(previewUrlKopi)
    } finally {
      setSender(false)
      inputRef.current?.focus()
    }
    // Merk: blob-URL beholdes ved suksess til realtime INSERT bytter ut
    // optimistisk-raden. Cleanup skjer i useEffect under når raden er borte.
  }

  function startLongPress(meldingId: string) {
    if (meldingId.startsWith('temp-')) return
    clearLongPress()
    longPressTimer.current = setTimeout(() => {
      setPickerFor(meldingId)
      // Haptisk feedback på mobil hvis tilgjengelig
      if (typeof window !== 'undefined' && 'navigator' in window) {
        navigator.vibrate?.(12)
      }
    }, 420)
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
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
    setPickerFor(null)

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

  function startEdit(meldingId: string, naavarende: string) {
    setPickerFor(null)
    setEditerer(meldingId)
    setEditTekst(naavarende)
  }

  function avbrytEdit() {
    setEditerer(null)
    setEditTekst('')
  }

  async function lagreEdit(id: string) {
    const ny = editTekst.trim()
    if (!ny || lagrerEdit) return
    // No-op hvis tekst er uendret
    const forrige = meldinger.find(m => m.id === id)
    if (forrige && forrige.innhold === ny) {
      avbrytEdit()
      return
    }
    setLagrerEdit(true)
    // Optimistisk oppdatering
    setMeldinger(prev => prev.map(m => (m.id === id ? { ...m, innhold: ny } : m)))
    try {
      if (scope.type === 'arrangement') {
        await oppdaterMelding(id, ny)
      } else if (scope.type === 'poll') {
        await oppdaterPollMelding(id, ny)
      } else if (scope.type === 'melding') {
        await oppdaterMeldingKommentar(id, ny)
      } else if (scope.type === 'privat') {
        await oppdaterPrivatMelding(id, ny)
      } else {
        await oppdaterKlubbMelding(id, ny)
      }
      avbrytEdit()
    } catch {
      // Rull tilbake ved feil
      if (forrige) {
        setMeldinger(prev =>
          prev.map(m => (m.id === id ? { ...m, innhold: forrige.innhold } : m)),
        )
      }
    } finally {
      setLagrerEdit(false)
    }
  }

  async function handleSlett(id: string) {
    if (!confirm('Slette denne meldingen?')) return
    setMeldinger(prev => prev.filter(m => m.id !== id))
    try {
      if (scope.type === 'arrangement') {
        await slettMelding(id)
      } else if (scope.type === 'poll') {
        await slettPollMelding(id)
      } else if (scope.type === 'melding') {
        await slettMeldingKommentar(id)
      } else if (scope.type === 'privat') {
        await slettPrivatMelding(id)
      } else {
        await slettKlubbMelding(id)
      }
    } catch {
      // Ved feil: last inn de siste N på nytt
      const nyeste = await hentMeldinger()
      setMeldinger(nyeste)
    }
  }

  return (
    <div style={{ marginTop: visSeksjonsLabel ? 28 : 0 }}>
      {visSeksjonsLabel && (
        <SectionLabel count={meldinger.length}>
          {scope.type === 'klubb' ? 'Samtale' : 'Kommentarer'}
        </SectionLabel>
      )}

      {/* Vis eldre-knapp */}
      {harMerEldre && meldinger.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <button
            type="button"
            onClick={lastEldre}
            disabled={henterEldre}
            style={{
              padding: '6px 14px',
              background: 'transparent',
              border: '0.5px solid var(--border)',
              borderRadius: 999,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '1.4px',
              textTransform: 'uppercase',
              cursor: henterEldre ? 'wait' : 'pointer',
              opacity: henterEldre ? 0.5 : 1,
            }}
          >
            {henterEldre ? 'Henter…' : 'Vis eldre'}
          </button>
        </div>
      )}

      {/* Meldingsliste */}
      <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
        {meldinger.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 0',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
            }}
          >
            Ingen meldinger ennå.
          </div>
        )}

        {meldinger.map((m, i) => {
          const forrige = i > 0 ? meldinger[i - 1] : null
          // Grupper sammenhengende meldinger fra samme bruker — skjul avatar
          // og navn/tid-header på fortsettelses-meldinger.
          const erFortsettelse = forrige?.profil_id === m.profil_id
          const erEgen = m.profil_id === brukerId
          // Slett-knapp: egen melding eller admin. Beskyttet mot mistrykk
          // med en confirm()-dialog i handleSlett.
          const kanSlette = erEgen || erAdmin
          const navn = profilMap.get(m.profil_id) ?? 'Ukjent'
          const bilde = bildeMap.get(m.profil_id)
          const rolle = rolleMap.get(m.profil_id) ?? null
          const tid = formaterDato(m.opprettet, 'HH:mm')
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: 10,
                flexDirection: erEgen ? 'row-reverse' : 'row',
                marginTop: erFortsettelse ? 3 : i === 0 ? 0 : 14,
              }}
            >
              <div style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
                {erFortsettelse ? (
                  // Tom plassholder så meldingene linjerer opp mot forrige boble
                  <div style={{ width: 26, height: 1 }} />
                ) : (
                  <Avatar name={navn} size={26} src={bilde} rolle={rolle} />
                )}
              </div>
              <div
                style={{
                  maxWidth: '78%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: erEgen ? 'flex-end' : 'flex-start',
                  minWidth: 0,
                }}
              >
                {!erFortsettelse && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 8,
                      marginBottom: 4,
                      paddingLeft: erEgen ? 0 : 2,
                      paddingRight: erEgen ? 2 : 0,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                        fontWeight: 500,
                      }}
                    >
                      {navn}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: 'var(--text-tertiary)',
                        letterSpacing: '1.2px',
                      }}
                    >
                      {tid}
                    </span>
                  </div>
                )}
                <div style={{ position: 'relative' }} className="chat-boble">
                  {editerer === m.id ? (
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: erEgen ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: erEgen ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                        border: '0.5px solid var(--accent)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        minWidth: 220,
                      }}
                    >
                      <textarea
                        autoFocus
                        value={editTekst}
                        onChange={e => setEditTekst(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            lagreEdit(m.id)
                          } else if (e.key === 'Escape') {
                            e.preventDefault()
                            avbrytEdit()
                          }
                        }}
                        maxLength={500}
                        rows={2}
                        style={{
                          width: '100%',
                          resize: 'none',
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: 'var(--text-primary)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 13,
                          lineHeight: 1.5,
                          padding: '2px 4px',
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          gap: 6,
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                        }}
                      >
                        <button
                          type="button"
                          onClick={avbrytEdit}
                          disabled={lagrerEdit}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            letterSpacing: '1.4px',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                            cursor: lagrerEdit ? 'wait' : 'pointer',
                          }}
                        >
                          Avbryt
                        </button>
                        <button
                          type="button"
                          onClick={() => lagreEdit(m.id)}
                          disabled={lagrerEdit || !editTekst.trim()}
                          style={{
                            padding: '4px 12px',
                            borderRadius: 999,
                            background: 'var(--accent)',
                            border: 'none',
                            color: '#0a0a0a',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 9,
                            letterSpacing: '1.4px',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                            cursor:
                              lagrerEdit || !editTekst.trim() ? 'default' : 'pointer',
                            opacity: lagrerEdit || !editTekst.trim() ? 0.5 : 1,
                          }}
                        >
                          {lagrerEdit ? 'Lagrer…' : 'Lagre'}
                        </button>
                      </div>
                    </div>
                  ) : (
                  <div
                    onTouchStart={() => startLongPress(m.id)}
                    onTouchEnd={clearLongPress}
                    onTouchMove={clearLongPress}
                    onTouchCancel={clearLongPress}
                    onContextMenu={e => {
                      // Hindrer iOS sin native callout (kopier/del) og
                      // fungerer som desktop-høyreklikk-trigger.
                      e.preventDefault()
                      if (!m.id.startsWith('temp-')) setPickerFor(m.id)
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: erEgen ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: erEgen ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                      border: `0.5px solid ${
                        erEgen ? 'var(--border-strong)' : 'var(--border-subtle)'
                      }`,
                      fontFamily: 'var(--font-body)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: 'var(--text-primary)',
                      letterSpacing: '0.1px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      cursor: 'default',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTouchCallout: 'none',
                      touchAction: 'manipulation',
                    }}
                  >
                    {m.bilde_url && (
                      <button
                        type="button"
                        onClick={() => setLightboxSrc(m.bilde_url)}
                        style={{
                          display: 'block',
                          padding: 0,
                          border: 'none',
                          background: 'none',
                          margin: m.innhold ? '0 0 8px' : 0,
                          cursor: 'zoom-in',
                          maxWidth: '100%',
                        }}
                        aria-label="Vis bilde i full skjerm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.bilde_url}
                          alt=""
                          loading="lazy"
                          style={{
                            display: 'block',
                            maxWidth: 280,
                            maxHeight: 280,
                            borderRadius: 8,
                            objectFit: 'cover',
                          }}
                        />
                      </button>
                    )}
                    {m.innhold && renderMedMentions(m.innhold)}
                  </div>
                  )}
                  {/* Reaksjons-chips — flyter på bunnkanten av bobla, ikke
                      egen linje. Negativ margin trekker dem opp slik at de
                      overlapper bobla, padding holder dem litt inn fra
                      kanten. Bottom-margin på .chat-boble (under) gir plass
                      til at de stikker ut. */}
                  {(() => {
                    const mineReaksjoner = reaksjonerPerMelding.get(m.id)
                    if (!mineReaksjoner || mineReaksjoner.length === 0) return null
                    const grupper = new Map<string, { antall: number; minReaksjon: boolean }>()
                    for (const r of mineReaksjoner) {
                      const g = grupper.get(r.emoji) ?? { antall: 0, minReaksjon: false }
                      g.antall += 1
                      if (r.profil_id === brukerId) g.minReaksjon = true
                      grupper.set(r.emoji, g)
                    }
                    return (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 2,
                          marginTop: -10,
                          paddingLeft: erEgen ? 0 : 8,
                          paddingRight: erEgen ? 8 : 0,
                          position: 'relative',
                          zIndex: 1,
                          justifyContent: erEgen ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {[...grupper.entries()].map(([emoji, { antall, minReaksjon }]) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaksjon(m.id, emoji)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              padding: '1px 6px',
                              borderRadius: 999,
                              border: `0.5px solid ${minReaksjon ? 'var(--accent)' : 'var(--border)'}`,
                              background: 'var(--bg-elevated-2)',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                              fontSize: 11,
                              lineHeight: 1.2,
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              fontFamily: 'var(--font-body)',
                            }}
                            aria-label={`${emoji} ${antall} ${minReaksjon ? '(fjern din reaksjon)' : '(reager også)'}`}
                          >
                            <span>{emoji}</span>
                            {antall > 1 && (
                              <span
                                style={{
                                  fontFamily: 'var(--font-mono)',
                                  fontSize: 9,
                                  color: minReaksjon ? 'var(--accent)' : 'var(--text-secondary)',
                                  fontWeight: 600,
                                }}
                              >
                                {antall}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )
                  })()}
                  {/* Picker — vises over bobla når long-press trigger */}
                  {pickerFor === m.id && (
                    <>
                      {/* Overlay som fanger klikk utenfor */}
                      <div
                        onClick={() => setPickerFor(null)}
                        style={{
                          position: 'fixed',
                          inset: 0,
                          zIndex: 90,
                          background: 'transparent',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 6px)',
                          [erEgen ? 'right' : 'left']: 0,
                          zIndex: 100,
                          display: 'flex',
                          gap: 4,
                          padding: '6px 8px',
                          borderRadius: 999,
                          background: 'var(--bg-elevated)',
                          border: '0.5px solid var(--border-strong)',
                          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
                        }}
                      >
                        {REAKSJON_EMOJIS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaksjon(m.id, emoji)}
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              border: 'none',
                              background: 'transparent',
                              fontSize: 20,
                              cursor: 'pointer',
                              padding: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            aria-label={`Reager med ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                        {erEgen && m.innhold !== null && (
                          <>
                            <div
                              style={{
                                width: '0.5px',
                                background: 'var(--border-subtle)',
                                margin: '4px 4px',
                              }}
                              aria-hidden="true"
                            />
                            <button
                              type="button"
                              onClick={() => startEdit(m.id, m.innhold!)}
                              style={{
                                height: 34,
                                borderRadius: 999,
                                border: 'none',
                                background: 'transparent',
                                fontFamily: 'var(--font-mono)',
                                fontSize: 9,
                                color: 'var(--text-secondary)',
                                letterSpacing: '1.4px',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '0 12px',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                              aria-label="Rediger melding"
                            >
                              Rediger
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                  {kanSlette && !m.id.startsWith('temp-') && (
                    <button
                      type="button"
                      onClick={() => handleSlett(m.id)}
                      className="chat-slett-knapp"
                      style={{
                        position: 'absolute',
                        top: -6,
                        [erEgen ? 'left' : 'right']: -6,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'var(--bg-elevated)',
                        border: '0.5px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                        color: 'var(--danger)',
                        opacity: 0,
                        transition: 'opacity 120ms',
                      }}
                      aria-label="Slett melding"
                    >
                      <Icon name="x" size={10} color="var(--danger)" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bunnenRef} />
      </div>

      {/* @mention-forslag */}
      {mentionForslag.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {mentionForslag.map(p => {
            const erAlle = p.id === '__alle__'
            return (
              <button
                key={p.id}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => velgMention(p.navn!)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: erAlle ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                  border: `0.5px solid ${erAlle ? 'var(--accent)' : 'var(--border)'}`,
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  fontWeight: erAlle ? 600 : 500,
                  cursor: 'pointer',
                }}
              >
                @{p.navn}
                {erAlle && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      letterSpacing: '1.2px',
                      textTransform: 'uppercase',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    varsler hele klubben
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Bilde-forhåndsvisning over input når et bilde er valgt */}
      {bildePreview && (
        <div
          style={{
            position: 'relative',
            marginBottom: 6,
            display: 'inline-block',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={bildePreview}
            alt="Forhåndsvisning"
            style={{
              maxWidth: 120,
              maxHeight: 120,
              borderRadius: 8,
              border: '0.5px solid var(--border)',
              objectFit: 'cover',
            }}
          />
          <button
            type="button"
            onClick={fjernBilde}
            aria-label="Fjern bilde"
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.75)',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
            }}
          >
            ×
          </button>
        </div>
      )}
      {bildeFeil && (
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            color: 'var(--danger)',
            marginBottom: 6,
          }}
        >
          {bildeFeil}
        </div>
      )}

      {/* Skriv melding — pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 8px 8px 12px',
          border: '0.5px solid var(--border)',
          borderRadius: 999,
          background: 'var(--bg-elevated)',
          marginBottom: 4,
        }}
      >
        <button
          type="button"
          onClick={() => bildeInputRef.current?.click()}
          aria-label="Legg ved bilde"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            flexShrink: 0,
            padding: 0,
          }}
        >
          <Icon name="image" size={18} color="currentColor" strokeWidth={1.8} />
        </button>
        <input
          ref={bildeInputRef}
          type="file"
          accept="image/*"
          onChange={velgBilde}
          style={{ display: 'none' }}
        />
        <input
          ref={inputRef}
          type="text"
          data-chat-input="true"
          value={tekst}
          onChange={e => {
            setTekst(e.target.value)
            oppdaterMentionSøk(e.target.value)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder={bildePreview ? 'Legg til tekst (valgfritt)…' : 'Skriv en melding…'}
          maxLength={scope.type === 'privat' ? INNLEGG_MAKS_LENGDE : CHAT_MAKS_LENGDE}
          enterKeyHint="send"
          autoComplete="off"
          style={{
            flex: 1,
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={(!tekst.trim() && !bildeFil) || sender}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: (!tekst.trim() && !bildeFil) || sender ? 'default' : 'pointer',
            opacity: (!tekst.trim() && !bildeFil) || sender ? 0.4 : 1,
            flexShrink: 0,
          }}
          aria-label="Send melding"
        >
          <Icon name="arrowRight" size={14} color="#0a0a0a" strokeWidth={2.5} />
        </button>
      </div>

      {lightboxSrc && (
        <BildeLightbox src={lightboxSrc} onLukk={() => setLightboxSrc(null)} />
      )}
    </div>
  )
}
