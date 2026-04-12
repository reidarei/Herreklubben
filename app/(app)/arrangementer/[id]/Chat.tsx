'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMelding, slettMelding } from '@/lib/actions/chat'
import { formaterDato } from '@/lib/dato'
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/outline'

type Melding = {
  id: string
  profil_id: string
  innhold: string
  opprettet: string
}

type Profil = { id: string; navn: string | null }

function renderMedMentions(tekst: string, erEgen: boolean) {
  const deler = tekst.split(/(@[\wæøåÆØÅ][\w æøåÆØÅ-]*)/g)
  return deler.map((del, i) =>
    del.startsWith('@') ? (
      <span key={i} style={{ fontWeight: 600, color: erEgen ? '#0a0a0a' : 'var(--accent)' }}>{del}</span>
    ) : del
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
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const profilMap = useRef(new Map(profiler.map(p => [p.id, p.navn ?? 'Ukjent']))).current
  const andreProfiler = useRef(profiler.filter(p => p.id !== brukerId && p.navn)).current

  // Finn @mention-forslag basert på tekst etter siste @
  const mentionForslag = mentionSøk !== null
    ? andreProfiler.filter(p =>
        p.navn!.toLowerCase().includes(mentionSøk.toLowerCase())
      ).slice(0, 5)
    : []

  function oppdaterMentionSøk(verdi: string) {
    const sisteAt = verdi.lastIndexOf('@')
    if (sisteAt === -1) { setMentionSøk(null); return }
    const etterAt = verdi.slice(sisteAt + 1)
    if (etterAt.endsWith('  ') || etterAt.includes('\n')) { setMentionSøk(null); return }
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
    bunnenRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Scroll til bunn ved nye meldinger (kun hvis allerede nær bunn)
  useEffect(() => {
    if (!scrollRef.current) return
    const el = scrollRef.current
    const erNærBunn = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (erNærBunn) scrollTilBunn()
  }, [meldinger.length, scrollTilBunn])

  // Scroll chat-boksen til bunn ved mount (uten å scrolle hele siden)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  // Skjul bottom-nav når input har fokus (tastatur åpent på mobil)
  useEffect(() => {
    function handleFocus() { document.documentElement.classList.add('chat-input-fokus') }
    function handleBlur() { document.documentElement.classList.remove('chat-input-fokus') }
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
    const supabase = createClient()

    async function startSubscription() {
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled || !session) return

      supabase.realtime.setAuth(session.access_token)

      const channel = supabase
        .channel(`chat-${arrangementId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'arrangement_chat',
          filter: `arrangement_id=eq.${arrangementId}`,
        }, (payload) => {
          const ny = payload.new as Melding
          setMeldinger(prev => {
            if (prev.some(m => m.id === ny.id)) return prev
            const utenTemp = prev.filter(m =>
              !(m.id.startsWith('temp-') && m.profil_id === ny.profil_id && m.innhold === ny.innhold)
            )
            return [...utenTemp, ny]
          })
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'arrangement_chat',
        }, (payload) => {
          const slettetId = (payload.old as { id: string }).id
          setMeldinger(prev => prev.filter(m => m.id !== slettetId))
        })
        .subscribe()

      return channel
    }

    let channelRef: ReturnType<typeof supabase.channel> | undefined
    startSubscription().then(ch => { channelRef = ch })

    return () => {
      cancelled = true
      if (channelRef) supabase.removeChannel(channelRef)
    }
  }, [arrangementId])

  // Re-fetch ved visibilitychange (iOS PWA dropper WebSocket i bakgrunnen)
  useEffect(() => {
    async function reFetch() {
      if (document.visibilityState !== 'visible') return
      const supabase = createClient()
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
  }, [arrangementId])

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
      const supabase = createClient()
      const { data } = await supabase
        .from('arrangement_chat')
        .select('id, profil_id, innhold, opprettet')
        .eq('arrangement_id', arrangementId)
        .order('opprettet')
        .limit(100)
      if (data) setMeldinger(data)
    }
  }

  function visTid(idx: number): boolean {
    if (idx === 0) return true
    const forrige = new Date(meldinger[idx - 1].opprettet).getTime()
    const denne = new Date(meldinger[idx].opprettet).getTime()
    return denne - forrige > 5 * 60 * 1000
  }

  return (
    <div className="mt-6">
      <p
        className="flex items-center gap-2 text-sm font-semibold py-2"
        style={{ color: 'var(--text-secondary)' }}
      >
        <ChatBubbleLeftRightIcon className="w-4 h-4" />
        Chat {meldinger.length > 0 && `(${meldinger.length})`}
      </p>

      {/* Meldingsliste */}
      <div
        ref={scrollRef}
        className="space-y-1 overflow-y-auto rounded-2xl p-3"
        style={{
          maxHeight: '360px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
        }}
      >
        {meldinger.length === 0 && (
          <p className="text-center text-sm py-6" style={{ color: 'var(--text-tertiary)' }}>
            Ingen meldinger ennå. Skriv noe!
          </p>
        )}

        {meldinger.map((m, idx) => {
          const erEgen = m.profil_id === brukerId
          const kanSlette = erEgen || erAdmin
          return (
            <div key={m.id}>
              {visTid(idx) && (
                <p className="text-center text-[11px] py-1.5" style={{ color: 'var(--text-tertiary)' }}>
                  {formaterDato(m.opprettet, "d. MMM 'kl.' HH:mm")}
                </p>
              )}
              <div style={{ display: 'flex', justifyContent: erEgen ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '80%' }}>
                  {!erEgen && (
                    <p className="text-[11px] mb-0.5 px-1" style={{ color: 'var(--text-tertiary)' }}>
                      {profilMap.get(m.profil_id) ?? 'Ukjent'}
                    </p>
                  )}
                  <div
                    className="group relative rounded-2xl px-3 py-2 text-sm"
                    style={{
                      background: erEgen ? 'var(--accent)' : 'var(--bg-elevated-2)',
                      color: erEgen ? '#0a0a0a' : 'var(--text-primary)',
                      borderBottomRightRadius: erEgen ? '4px' : undefined,
                      borderBottomLeftRadius: !erEgen ? '4px' : undefined,
                    }}
                  >
                    <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {renderMedMentions(m.innhold, erEgen)}
                    </span>
                    {kanSlette && !m.id.startsWith('temp-') && (
                      <button
                        onClick={() => handleSlett(m.id)}
                        className="absolute -top-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          [erEgen ? 'left' : 'right']: '-8px',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)',
                          borderRadius: '50%',
                          width: '22px',
                          height: '22px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <TrashIcon className="w-3 h-3" style={{ color: 'var(--destructive)' }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bunnenRef} />
      </div>

      {/* @mention-forslag */}
      {mentionForslag.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2 px-1">
          {mentionForslag.map(p => (
            <button
              key={p.id}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => velgMention(p.navn!)}
              className="text-[13px] px-3 py-1.5 rounded-[10px]"
              style={{
                background: 'var(--bg-elevated-2)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
                fontFamily: 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              @{p.navn}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 mt-2">
        <input
          ref={inputRef}
          type="text"
          value={tekst}
          onChange={e => { setTekst(e.target.value); oppdaterMentionSøk(e.target.value) }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Skriv en melding..."
          maxLength={500}
          className="flex-1 text-sm rounded-xl px-3 py-2"
          style={{
            background: 'var(--bg-elevated-2)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!tekst.trim() || sender}
          className="rounded-xl px-3 py-2 disabled:opacity-30"
          style={{ background: 'var(--accent)', border: 'none', cursor: 'pointer' }}
        >
          <PaperAirplaneIcon className="w-4 h-4" style={{ color: '#0a0a0a' }} />
        </button>
      </div>
    </div>
  )
}
