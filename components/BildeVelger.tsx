'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { komprimer, genererFilnavn } from '@/lib/bilde-utils'
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function BildeVelger({
  bildeUrl,
  onBildeUrl,
}: {
  bildeUrl: string | null
  onBildeUrl: (url: string | null) => void
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

  async function fjernBilde() {
    if (!bildeUrl) return
    if (bildeUrl.includes('supabase')) {
      try {
        const supabase = createClient()
        const urlDeler = bildeUrl.split('/arrangement-bilder/')
        if (urlDeler[1]) {
          await supabase.storage.from('arrangement-bilder').remove([urlDeler[1]])
        }
      } catch {
        // Ignorer feil ved sletting
      }
    }
    onBildeUrl(null)
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        Bilde
      </label>

      {bildeUrl ? (
        <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <img src={bildeUrl} alt="" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={fjernBilde}
            className="absolute top-2 right-2 p-1.5 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={laster}
          className="w-full py-8 rounded-xl flex flex-col items-center gap-2 transition-colors"
          style={{
            background: 'var(--bg-elevated)',
            border: '2px dashed var(--border)',
            color: laster ? 'var(--text-tertiary)' : 'var(--text-secondary)',
            cursor: laster ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <PhotoIcon className="w-8 h-8" style={{ color: 'var(--text-tertiary)' }} />
          <span className="text-sm">{laster ? 'Laster opp...' : 'Velg bilde fra galleriet'}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFil}
      />

      {feil && <p className="text-xs mt-1" style={{ color: 'var(--destructive)' }}>{feil}</p>}
      <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
        Maks 5 MB · JPEG, PNG eller WebP · Uten bilde brukes standard klubb-bilde
      </p>
    </div>
  )
}
