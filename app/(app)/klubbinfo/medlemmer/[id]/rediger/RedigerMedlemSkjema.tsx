'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { oppdaterMedlemAdmin, slettMedlem } from '@/lib/actions/profil'

const inputStil = {
  background: 'var(--bg-elevated-2)',
  border: '1px solid var(--border)',
  color: 'var(--text-primary)',
  borderRadius: '0.75rem',
  padding: '0.75rem 1rem',
  width: '100%',
  fontSize: '1rem',
}

type Medlem = { id: string; navn: string; visningsnavn: string; epost: string; telefon: string | null; rolle: string; aktiv: boolean }

export default function RedigerMedlemSkjema({ medlem }: { medlem: Medlem }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      await oppdaterMedlemAdmin(medlem.id, {
        navn: fd.get('navn') as string,
        visningsnavn: fd.get('visningsnavn') as string,
        telefon: fd.get('telefon') as string,
        rolle: fd.get('rolle') as string,
        aktiv: fd.get('aktiv') === 'true',
      })
      router.push('/klubbinfo/medlemmer')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">
      <div>
        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Navn</label>
        <input name="navn" type="text" required defaultValue={medlem.navn} style={inputStil} />
      </div>
      <div>
        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Visningsnavn (kallenavn)</label>
        <input name="visningsnavn" type="text" required defaultValue={medlem.visningsnavn} style={inputStil} />
      </div>
      <div>
        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>E-post</label>
        <input type="text" value={medlem.epost} disabled style={{ ...inputStil, opacity: 0.5 }} />
      </div>
      <div>
        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Telefon</label>
        <input name="telefon" type="tel" defaultValue={medlem.telefon ?? ''} style={inputStil} />
      </div>
      <div>
        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Rolle</label>
        <select name="rolle" defaultValue={medlem.rolle} style={inputStil}>
          <option value="medlem">Medlem</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1.5" style={{ color: 'var(--text-secondary)' }}>Status</label>
        <select name="aktiv" defaultValue={String(medlem.aktiv)} style={inputStil}>
          <option value="true">Aktiv</option>
          <option value="false">Deaktivert</option>
        </select>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()} className="flex-1 py-3 rounded-xl font-semibold text-sm"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
          Avbryt
        </button>
        <button type="submit" disabled={isPending} className="flex-1 py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
          style={{ background: 'var(--accent)' }}>
          {isPending ? 'Lagrer...' : 'Lagre'}
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          if (confirm(`Slette ${medlem.navn}? Dette kan ikke angres.`)) {
            startTransition(() => slettMedlem(medlem.id))
          }
        }}
        disabled={isPending}
        className="w-full py-2.5 rounded-xl text-sm font-semibold mt-2 disabled:opacity-50"
        style={{ background: 'transparent', border: '1px solid var(--destructive-subtle)', color: 'var(--destructive)' }}>
        Slett medlem
      </button>
    </form>
  )
}
