'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { komprimer, genererFilnavn } from '@/lib/bilde-utils'

// Enkelt "Bytt bilde"-kontroll som åpner mobilens galleri direkte,
// laster opp og kaller onBildeUrl med den nye public-URLen.
// Viser ingen forhåndsvisning selv — forelderen viser det aktive bildet.
export default function BildeBytterKnapp({
  onBildeUrl,
  label = 'Bytt bilde',
  style,
}: {
  onBildeUrl: (url: string) => void
  label?: string
  style?: React.CSSProperties
}) {
  const [laster, setLaster] = useState(false)
  const [feil, setFeil] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFil(e: React.ChangeEvent<HTMLInputElement>) {
    const fil = e.target.files?.[0]
    if (!fil) return
    setFeil('')
    setLaster(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Ikke innlogget')

      const komprimert = await komprimer(fil)
      const filnavn = genererFilnavn(komprimert)
      const sti = `${user.id}/${filnavn}`

      const { error } = await supabase.storage
        .from('arrangement-bilder')
        .upload(sti, komprimert, { contentType: 'image/jpeg' })

      if (error) throw new Error(error.message)

      const { data: { publicUrl } } = supabase.storage
        .from('arrangement-bilder')
        .getPublicUrl(sti)

      onBildeUrl(publicUrl)
    } catch (err) {
      setFeil(err instanceof Error ? err.message : 'Opplasting feilet')
    } finally {
      setLaster(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={laster}
        style={{
          background: 'rgba(10,10,12,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--text-primary)',
          border: '0.5px solid var(--border)',
          padding: '7px 14px',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'var(--font-body)',
          cursor: laster ? 'wait' : 'pointer',
          opacity: laster ? 0.7 : 1,
          ...style,
        }}
      >
        {laster ? 'Laster opp…' : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFil}
      />
      {feil && (
        <p
          style={{
            fontSize: 11,
            color: 'var(--danger, #d97a6c)',
            marginTop: 6,
            fontFamily: 'var(--font-body)',
          }}
        >
          {feil}
        </p>
      )}
    </>
  )
}
