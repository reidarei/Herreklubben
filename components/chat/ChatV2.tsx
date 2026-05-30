'use client'

// ChatV2: ny fullskjerm-chat-implementasjon med intern scroll-container
// i stedet for window-scroll. Krever resizes-content i chat/layout.tsx.
// Erstatter Chat.tsx på /chat-ruten når CHAT_LEGACY_FALLBACK=false (default).
// Se issue #210 for bakgrunn og PR 2 for denne implementasjonen.

import { Fragment, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { type ChatScope as ChatScopeKonfig } from '@/lib/chat-konfig'
import { formaterDato, erSammeNorskeDag, formaterDatoSkille } from '@/lib/dato'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import BildeLightbox from '@/components/ui/BildeLightbox'
import MessengerBadge from '@/components/ui/MessengerBadge'
import { komprimer } from '@/lib/bilde-utils'
import {
  beregnMentionSøk,
  velgMentionTekst,
  lagMentionForslag,
  type ChatProfil,
} from '@/lib/mention'
import MentionVelger from '@/components/agenda/MentionVelger'
import { useChatData } from './hooks/useChatData'
import { useChatScrollV2 } from './hooks/useChatScrollV2'
import type { ChatMelding as ChatMeldingType } from './types'

export type ChatScope = ChatScopeKonfig
export type ChatMelding = ChatMeldingType

// Emojis tilgjengelige i reaksjons-picker
const REAKSJON_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥', '🙌'] as const

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
  /** Hvis true: scroll containeren til siste melding ved mount og ved nye
   * meldinger. Alltid true på /chat — prop beholdes for konsistens med Chat.tsx. */
  autoScrollTilBunn?: boolean
  /** Header-blokk (breadcrumb + tittel + privatmelding-lenke) som skal
   * scrolle med meldingslisten i stedet for å ligge sticky over den.
   * Sender page.tsx inn dette som ReactNode. */
  headerSlot?: ReactNode
}

export default function ChatV2({
  scope,
  brukerId,
  erAdmin,
  initialMeldinger,
  profiler,
  autoScrollTilBunn = false,
  headerSlot,
}: Props) {
  const {
    meldinger,
    reaksjoner,
    reaksjonerPerMelding,
    harMerEldre,
    henterEldre,
    lastEldre,
    send,
    slett,
    redigerMelding,
    toggleReaksjon: toggleReaksjonHook,
    konfig,
  } = useChatData({ scope, brukerId, initialMeldinger })

  // scrollContainerRef peker på den indre scroll-div-en.
  // Sendes ned til useChatScrollV2 og IntersectionObserver.
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const { bunnenRef, visNyMeldingPille, scrollTilBunn } = useChatScrollV2({
    containerRef: scrollContainerRef,
    meldinger,
    brukerId,
    autoScrollTilBunn,
  })

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
  // Hvilken melding viser picker. Null = ingen.
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  // Hvilken melding redigeres. Null = ingen. editTekst holder editert innhold.
  const [editerer, setEditerer] = useState<string | null>(null)
  const [editTekst, setEditTekst] = useState('')
  const [lagrerEdit, setLagrerEdit] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Sentinel-div øverst i meldingslisten. IntersectionObserver trigges når
  // den scrolles inn i scroll-containeren (ikke viewport) — oppgi root
  // eksplisitt i observer-options, ellers brukes window og sentinel-en
  // er alltid «synlig» siden containeren er utenfor viewport. Se #210.
  const toppSentinelRef = useRef<HTMLDivElement>(null)
  // Gating: vi starter ikke auto-load eldre meldinger før brukeren faktisk
  // har scrollet. 300ms delay etter mount hindrer at siden laster eldre
  // meldinger allerede ved initial render på korte chatter.
  // I ChatV2 lytter vi på container-scroll (ikke window-scroll).
  const harBrukerScrolletRef = useRef(false)

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

  // Frigjør blob-URL når preview byttes
  useEffect(() => {
    return () => {
      if (bildePreview) URL.revokeObjectURL(bildePreview)
    }
  }, [bildePreview])

  // Sett harBrukerScrolletRef etter 300ms, lyt på container-scroll (ikke
  // window) slik at vi vet at brukeren faktisk har scrollet i chatten.
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    // container er ikke-null her (sjekket over), men TypeScript mister
    // narrowing inn i setTimeout-callback — eksplisitt capture i lokal const.
    const el = container
    const timer = setTimeout(() => {
      function onScroll() {
        harBrukerScrolletRef.current = true
        el.removeEventListener('scroll', onScroll)
      }
      el.addEventListener('scroll', onScroll, { passive: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  // IntersectionObserver: kall lastEldre() automatisk når toppSentinelRef
  // scrolles inn i scroll-containeren. Bevisst minimal `useEffect`-dep
  // ([harMerEldre]) for å unngå at observer remountes ved hver meldinger-
  // endring — det er nettopp det som tidligere ga flikk-loop fordi en ny
  // observer øyeblikkelig fyrer hvis sentinel synes innenfor rootMargin
  // (#210 PR 3 fant scroll-anchor-bug, PR 4 fant remount-bug).
  //
  // For å holde callback'en oppdatert uten å være dep, leser vi siste
  // lastEldre via ref. Reset av observer skjer KUN når harMerEldre toggles
  // (true → false når alle gamle meldinger er hentet).
  const lastEldreRef = useRef(lastEldre)
  useEffect(() => {
    lastEldreRef.current = lastEldre
  }, [lastEldre])

  useEffect(() => {
    if (!harMerEldre) return
    const sentinel = toppSentinelRef.current
    const container = scrollContainerRef.current
    if (!sentinel || !container) return

    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting) return
        if (!harBrukerScrolletRef.current) return
        lastEldreRef.current()
      },
      {
        root: container,
        rootMargin: '200px 0px 0px 0px',
      },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [harMerEldre])

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

  // Mention-state og -forslag styres av hjelperne i lib/mention.ts.
  // andreProfiler-filteret over ekskluderer allerede innlogget bruker, men vi
  // sender brukerId likevel som ekskluder for å gjøre kontrakten eksplisitt.
  const mentionForslag = lagMentionForslag(mentionSøk, andreProfiler, brukerId)

  function velgMention(navn: string) {
    const nyTekst = velgMentionTekst(tekst, navn)
    setTekst(nyTekst)
    setMentionSøk(null)
    inputRef.current?.focus()
  }

  async function handleSend() {
    const melding = tekst.trim() || null
    const harBilde = !!bildeFil
    if (!melding && !harBilde) return
    if (sender) return

    setTekst('')
    setMentionSøk(null)
    setSender(true)
    const filUploadKopi = bildeFil
    const previewUrlKopi = bildePreview
    setBildeFil(null)
    setBildePreview(null) // ikke revoke ennå — optimistisk rad bruker den

    try {
      await send(melding, filUploadKopi, previewUrlKopi)
    } catch {
      setBildeFeil('Kunne ikke sende meldingen')
    } finally {
      setSender(false)
      inputRef.current?.focus()
    }
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
    setPickerFor(null)
    await toggleReaksjonHook(meldingId, emoji)
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
    try {
      await redigerMelding(id, ny)
      avbrytEdit()
    } catch {
      // Rollback skjer inne i useChatData.redigerMelding — ingenting å gjøre her.
    } finally {
      setLagrerEdit(false)
    }
  }

  async function handleSlett(id: string) {
    if (!confirm('Slette denne meldingen?')) return
    await slett(id)
  }

  return (
    // Ytre flex-container tar nøyaktig den høyden som gjenstår under
    // top-headeren. CSS-var(--top-header-h) settes av TopHeader-komponenten;
    // 60px er fallback. Med resizes-content krymper dette arealet når
    // tastaturet åpner — containeren + input-baren følger med automatisk.
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100dvh - var(--top-header-h, 60px))',
        // position: relative slik at «Ny melding»-pillen (absolutt-posisjonert
        // lenger ned) plasseres relativt til denne wrapperen, ikke til body.
        position: 'relative',
      }}
    >
      {/* Indre scroll-container — tar all ledig plass, scroller internt.
          overscrollBehavior:contain hindrer at pull-to-refresh på /chat
          trigges ved scrolling til toppen av meldingslisten. */}
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
          padding: '0 20px',
        }}
      >
        {/* Header scroller med innholdet (iMessage-aktig). page.tsx
            sender headerSlot slik at /chat-siden kan kontrollere innholdet
            uten at ChatV2 trenger å vite om breadcrumb / privatmelding-lenke. */}
        {headerSlot}

        {/* Laster eldre — progress-pille mens henting pågår */}
        {henterEldre && (
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '6px 14px',
                background: 'transparent',
                border: '0.5px solid var(--border)',
                borderRadius: 999,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '1.4px',
                textTransform: 'uppercase',
                opacity: 0.5,
              }}
            >
              Henter eldre…
            </span>
          </div>
        )}
        {/* Usynlig sentinel øverst i meldingslisten. IntersectionObserver
            (useEffect over) kaller lastEldre() når den scrolles inn.
            Beholdes mountet hele tiden mens harMerEldre er true — pillen
            over rendres ved siden av. root er scrollContainerRef slik at
            vi observerer mot containeren, ikke mot viewporten. */}
        {harMerEldre && (
          <div ref={toppSentinelRef} style={{ height: 1 }} />
        )}

        {/* Meldingsliste */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 4,
            // Litt padding i bunn av scroll-containeren så siste melding
            // ikke klistrer seg mot input-baren
            paddingBottom: 8,
          }}
        >
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
            // Vis dato-skille når det er første melding eller ny kalenderdag (norsk tid).
            const visDatoSkille = !forrige || !erSammeNorskeDag(forrige.opprettet, m.opprettet)
            // Grupper sammenhengende meldinger fra samme bruker — skjul avatar
            // og navn/tid-header på fortsettelses-meldinger. Dato-skille bryter
            // alltid grupperingen så første melding på ny dag alltid viser header.
            const erFortsettelse = !visDatoSkille && forrige?.profil_id === m.profil_id
            const erEgen = m.profil_id === brukerId
            // Slett-knapp: kun egen-eier. Admin har ingen UI-snarvei for å
            // slette andres meldinger — om noe må fjernes må admin gjøre det
            // direkte i DB. Gjelder også FB-importerte: sendte du meldingen
            // (i appen eller i Messenger som senere ble importert), kan du
            // slette den her.
            const kanSlette = erEgen
            const navn = profilMap.get(m.profil_id) ?? 'Ukjent'
            const bilde = bildeMap.get(m.profil_id)
            const rolle = rolleMap.get(m.profil_id) ?? null
            const tid = formaterDato(m.opprettet, 'HH:mm')
            return (
              <Fragment key={m.id}>
                {visDatoSkille && (
                  <div
                    role="separator"
                    aria-label={`Meldinger fra ${formaterDatoSkille(m.opprettet)}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 8,
                      margin: '10px 0 2px',
                      paddingRight: 2,
                    }}
                  >
                    <span aria-hidden="true" style={{ width: 24, height: '0.5px', background: 'var(--border-subtle)' }} />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        letterSpacing: '1.2px',
                        fontWeight: 600,
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {formaterDatoSkille(m.opprettet)}
                    </span>
                  </div>
                )}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexDirection: erEgen ? 'row-reverse' : 'row',
                  marginTop: erFortsettelse ? 2 : i === 0 ? 0 : 8,
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
                        marginBottom: 2,
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
                          maxLength={konfig.charLimit}
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
                        padding: '7px 12px',
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
                      {m.video_url && (
                        <video
                          src={m.video_url}
                          controls
                          preload="metadata"
                          playsInline
                          style={{
                            display: 'block',
                            maxWidth: 280,
                            height: 'auto',
                            maxHeight: 280,
                            borderRadius: 8,
                            marginBottom: m.innhold ? 8 : 0,
                          }}
                        />
                      )}
                      {m.innhold && renderMedMentions(m.innhold)}
                    </div>
                    )}
                    {m.fra_facebook && <MessengerBadge erEgen={erEgen} />}
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
              </Fragment>
            )
          })}
          <div ref={bunnenRef} />
        </div>
      </div>

      {/* «Ny melding»-pille — absolutt-posisjonert relativt til ytre flex-wrapper,
          rett over input-baren. Fade-in 200ms. Tap scroller til bunn og skjuler pilla.
          Ingen pointer-events på ytre wrapper (pilla er eneste interaksjonsflate her). */}
      {visNyMeldingPille && (
        <div
          style={{
            position: 'absolute',
            // 56px = input-pille (~48px) + flex-wrapper-padding. env() i tillegg for safe-area.
            bottom: 'calc(56px + env(safe-area-inset-bottom) + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25,
            animation: 'page-fadein 200ms ease',
          }}
        >
          <button
            type="button"
            onClick={() => scrollTilBunn()}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(30,32,40,0.92)',
              border: '0.5px solid var(--border-strong)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              whiteSpace: 'nowrap',
            }}
          >
            ↓ Ny melding
          </button>
        </div>
      )}

      {/* Input-bar — flexShrink:0 slik at den aldri komprimeres av scroll-
          containeren. Ingen sticky/fixed: resizes-content sørger for at hele
          layout-treet flyttes opp ved tastatur-åpning. */}
      <div
        style={{
          flexShrink: 0,
          padding: '0 20px',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* @mention-forslag */}
        <MentionVelger forslag={mentionForslag} onVelg={velgMention} />
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

        {/* Skriv melding — pill. Solid bakgrunn (ikke --bg-elevated som er
            95% opaque) så eventuelle meldinger som glir bak pillen ikke
            skinner gjennom. */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 8px 8px 12px',
            border: '0.5px solid var(--border)',
            borderRadius: 999,
            background: '#282a32',
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
            value={tekst}
            onChange={e => {
              setTekst(e.target.value)
              setMentionSøk(beregnMentionSøk(e.target.value))
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={bildePreview ? 'Legg til tekst (valgfritt)…' : 'Skriv en melding…'}
            maxLength={konfig.charLimit}
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
      </div>

      {lightboxSrc && (
        <BildeLightbox src={lightboxSrc} onLukk={() => setLightboxSrc(null)} />
      )}
    </div>
  )
}
