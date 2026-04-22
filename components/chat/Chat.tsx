'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  sendMelding,
  slettMelding,
  sendKlubbMelding,
  slettKlubbMelding,
} from '@/lib/actions/chat'
import { formaterDato } from '@/lib/dato'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import SectionLabel from '@/components/ui/SectionLabel'

export type ChatScope =
  | { type: 'arrangement'; arrangementId: string }
  | { type: 'klubb' }

export type ChatMelding = {
  id: string
  profil_id: string
  innhold: string
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

function renderMedMentions(tekst: string) {
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

  const tabell = scope.type === 'klubb' ? 'klubb_chat' : 'arrangement_chat'
  const kanalNavn = scope.type === 'klubb' ? 'chat-klubb' : `chat-arr-${scope.arrangementId}`

  // Helper — henter meldinger med riktig scope-filter. Returnerer i
  // *stigende* rekkefølge (eldste først) siden det er det UI-et ønsker.
  const hentMeldinger = useCallback(
    async (forTidspunkt?: string): Promise<ChatMelding[]> => {
      if (scope.type === 'klubb') {
        let q = supabase
          .from('klubb_chat')
          .select('id, profil_id, innhold, opprettet')
          .order('opprettet', { ascending: false })
          .limit(SIDE_STORRELSE)
        if (forTidspunkt) q = q.lt('opprettet', forTidspunkt)
        const { data } = await q
        return data ? [...data].reverse() : []
      }
      let q = supabase
        .from('arrangement_chat')
        .select('id, profil_id, innhold, opprettet')
        .eq('arrangement_id', scope.arrangementId)
        .order('opprettet', { ascending: false })
        .limit(SIDE_STORRELSE)
      if (forTidspunkt) q = q.lt('opprettet', forTidspunkt)
      const { data } = await q
      return data ? [...data].reverse() : []
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scope.type, scope.type === 'arrangement' ? scope.arrangementId : '', supabase],
  )

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

  const scrollTilBunn = useCallback(() => {
    bunnenRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  // Scroll til bunn når listen endres, men ikke når vi har prependet eldre
  // meldinger (da skal vi ikke flytte synsvinkelen).
  const forrigeLengde = useRef(meldinger.length)
  useEffect(() => {
    const lengdeForDenneEffekten = meldinger.length
    const diff = lengdeForDenneEffekten - forrigeLengde.current
    forrigeLengde.current = lengdeForDenneEffekten
    // Bare scroll hvis nye meldinger dukker opp i bunnen (positive diff <= 3)
    // Store differ (= paginering) scroller vi ikke for.
    if (diff > 0 && diff <= 3) scrollTilBunn()
  }, [meldinger.length, scrollTilBunn])

  // Skjul bottom-nav når input har fokus (tastatur åpent på mobil)
  useEffect(() => {
    function handleFocus() {
      document.documentElement.classList.add('chat-input-fokus')
    }
    function handleBlur() {
      document.documentElement.classList.remove('chat-input-fokus')
    }
    const input = inputRef.current
    if (!input) return
    input.addEventListener('focus', handleFocus)
    input.addEventListener('blur', handleBlur)
    return () => {
      input.removeEventListener('focus', handleFocus)
      input.removeEventListener('blur', handleBlur)
      document.documentElement.classList.remove('chat-input-fokus')
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

      // Filter: for arrangement, filtrer på arrangement_id. For klubb, ingen
      // filter siden tabellen kun inneholder klubb-meldinger.
      const insertConfig = scope.type === 'arrangement'
        ? {
            event: 'INSERT' as const,
            schema: 'public',
            table: tabell,
            filter: `arrangement_id=eq.${scope.arrangementId}`,
          }
        : { event: 'INSERT' as const, schema: 'public', table: tabell }

      const deleteConfig = { event: 'DELETE' as const, schema: 'public', table: tabell }

      channel
        .on('postgres_changes', insertConfig, payload => {
          const ny = payload.new as ChatMelding
          setMeldinger(prev => {
            if (prev.some(m => m.id === ny.id)) return prev
            const utenTemp = prev.filter(
              m =>
                !(
                  m.id.startsWith('temp-') &&
                  m.profil_id === ny.profil_id &&
                  m.innhold === ny.innhold
                ),
            )
            return [...utenTemp, ny]
          })
        })
        .on('postgres_changes', deleteConfig, payload => {
          const slettetId = (payload.old as { id: string }).id
          setMeldinger(prev => prev.filter(m => m.id !== slettetId))
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
  }, [scope.type, scope.type === 'arrangement' ? scope.arrangementId : '', supabase])

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
    const melding = tekst.trim()
    if (!melding || sender) return
    setTekst('')
    setMentionSøk(null)
    setSender(true)

    const tempId = `temp-${Date.now()}`
    const optimistisk: ChatMelding = {
      id: tempId,
      profil_id: brukerId,
      innhold: melding,
      opprettet: new Date().toISOString(),
    }
    setMeldinger(prev => [...prev, optimistisk])

    try {
      if (scope.type === 'arrangement') {
        await sendMelding(scope.arrangementId, melding)
      } else {
        await sendKlubbMelding(melding)
      }
    } catch {
      setMeldinger(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSender(false)
      inputRef.current?.focus()
    }
  }

  async function handleSlett(id: string) {
    setMeldinger(prev => prev.filter(m => m.id !== id))
    try {
      if (scope.type === 'arrangement') {
        await slettMelding(id)
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
      {visSeksjonsLabel && <SectionLabel count={meldinger.length}>Samtale</SectionLabel>}

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
          // Slett-knappen er bevisst deaktivert — det var for lett å mistrykke
          // og ingen skal egentlig kunne slette chat-meldinger. Server-actionene
          // (slettMelding / slettKlubbMelding) finnes fortsatt for manuelle
          // databaseinngrep. Flipp tilbake til `erEgen || erAdmin` ved behov.
          const kanSlette = false
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
                  <div
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
                    }}
                  >
                    {renderMedMentions(m.innhold)}
                  </div>
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

      {/* Skriv melding — pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 8px 8px 16px',
          border: '0.5px solid var(--border)',
          borderRadius: 999,
          background: 'var(--bg-elevated)',
          marginBottom: 4,
        }}
      >
        <input
          ref={inputRef}
          type="text"
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
          placeholder="Skriv en melding…"
          maxLength={500}
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
          disabled={!tekst.trim() || sender}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--accent)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: !tekst.trim() || sender ? 'default' : 'pointer',
            opacity: !tekst.trim() || sender ? 0.4 : 1,
            flexShrink: 0,
          }}
          aria-label="Send melding"
        >
          <Icon name="arrowRight" size={14} color="#0a0a0a" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}
