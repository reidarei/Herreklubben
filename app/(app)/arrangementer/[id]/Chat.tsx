'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMelding, slettMelding } from '@/lib/actions/chat'
import { formaterDato } from '@/lib/dato'
import Avatar from '@/components/ui/Avatar'
import Icon from '@/components/ui/Icon'
import SectionLabel from '@/components/ui/SectionLabel'

type Melding = {
  id: string
  profil_id: string
  innhold: string
  opprettet: string
}

type Profil = { id: string; navn: string | null; bilde_url: string | null }

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

export default function Chat({
  arrangementId,
  brukerId,
  erAdmin,
  initialMeldinger,
  profiler,
}: {
  arrangementId: string
  brukerId: string
  erAdmin: boolean
  initialMeldinger: Melding[]
  profiler: Profil[]
}) {
  const [meldinger, setMeldinger] = useState<Melding[]>(initialMeldinger)
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
  const andreProfiler = useRef(
    profiler.filter(p => p.id !== brukerId && p.navn),
  ).current
  const supabase = useRef(createClient()).current

  const mentionForslag =
    mentionSøk !== null
      ? andreProfiler
          .filter(p => p.navn!.toLowerCase().includes(mentionSøk.toLowerCase()))
          .slice(0, 5)
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

  useEffect(() => {
    scrollTilBunn()
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

  // Realtime-subscription
  useEffect(() => {
    let cancelled = false

    async function startSubscription() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (cancelled || !session) return

      supabase.realtime.setAuth(session.access_token)

      const channel = supabase
        .channel(`chat-${arrangementId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'arrangement_chat',
            filter: `arrangement_id=eq.${arrangementId}`,
          },
          payload => {
            const ny = payload.new as Melding
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
          },
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'arrangement_chat',
          },
          payload => {
            const slettetId = (payload.old as { id: string }).id
            setMeldinger(prev => prev.filter(m => m.id !== slettetId))
          },
        )
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
  }, [arrangementId, supabase])

  // Re-fetch ved visibilitychange (iOS PWA dropper WebSocket i bakgrunnen)
  useEffect(() => {
    async function reFetch() {
      if (document.visibilityState !== 'visible') return
      const { data } = await supabase
        .from('arrangement_chat')
        .select('id, profil_id, innhold, opprettet')
        .eq('arrangement_id', arrangementId)
        .order('opprettet')
        .limit(100)
      if (data) setMeldinger(data)
    }

    document.addEventListener('visibilitychange', reFetch)
    return () => document.removeEventListener('visibilitychange', reFetch)
  }, [arrangementId, supabase])

  async function handleSend() {
    const melding = tekst.trim()
    if (!melding || sender) return
    setTekst('')
    setMentionSøk(null)
    setSender(true)

    const tempId = `temp-${Date.now()}`
    const optimistisk: Melding = {
      id: tempId,
      profil_id: brukerId,
      innhold: melding,
      opprettet: new Date().toISOString(),
    }
    setMeldinger(prev => [...prev, optimistisk])

    try {
      await sendMelding(arrangementId, melding)
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
      await slettMelding(id)
    } catch {
      const { data } = await supabase
        .from('arrangement_chat')
        .select('id, profil_id, innhold, opprettet')
        .eq('arrangement_id', arrangementId)
        .order('opprettet')
        .limit(100)
      if (data) setMeldinger(data)
    }
  }

  return (
    <div style={{ marginTop: 28 }}>
      <SectionLabel count={meldinger.length}>Samtale</SectionLabel>

      {/* Meldingsliste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
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

        {meldinger.map(m => {
          const erEgen = m.profil_id === brukerId
          const kanSlette = erEgen || erAdmin
          const navn = profilMap.get(m.profil_id) ?? 'Ukjent'
          const bilde = bildeMap.get(m.profil_id)
          const tid = formaterDato(m.opprettet, 'HH:mm')
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: 10,
                flexDirection: erEgen ? 'row-reverse' : 'row',
              }}
            >
              <div style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
                <Avatar name={navn} size={26} src={bilde} />
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
          {mentionForslag.map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => velgMention(p.navn!)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                background: 'var(--bg-elevated)',
                border: '0.5px solid var(--border)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              @{p.navn}
            </button>
          ))}
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
