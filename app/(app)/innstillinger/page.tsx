import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import SendTestKnapp from './SendTestKnapp'

const typeLabels: Record<string, string> = {
  nytt: 'Nytt arrangement',
  paaminne_7: 'Påminnelse 7 dager',
  paaminne_1: 'Påminnelse 1 dag',
  purring: 'Purring',
}

export default async function Innstillinger() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profil } = await supabase.from('profiles').select('rolle').eq('id', user!.id).single()
  if (profil?.rolle !== 'admin') notFound()

  const { data: logg } = await supabase
    .from('varsler_logg')
    .select('id, type, sendt_at, arrangementer (tittel)')
    .order('sendt_at', { ascending: false })
    .limit(30)

  const { count: pushCount } = await supabase
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/klubbinfo" className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>← Tilbake</Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--tekst)' }}>Innstillinger</h1>
      </div>

      {/* Push-status */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--tekst)' }}>Push-varsler</p>
        <p className="text-xs" style={{ color: 'var(--tekst-dempet)' }}>
          {pushCount ?? 0} enhet{(pushCount ?? 0) !== 1 ? 'er' : ''} registrert
        </p>
      </div>

      {/* Påminnelseskonfig */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--bakgrunn-kort)', border: '1px solid var(--border)' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--tekst)' }}>Automatiske påminnelser</p>
        <div className="space-y-2 text-xs" style={{ color: 'var(--tekst-dempet)' }}>
          <p>✓ Nytt arrangement — sendes til alle andre ved opprettelse</p>
          <p>✓ Påminnelse 7 dager før — daglig kl. 09:00</p>
          <p>✓ Påminnelse 1 dag før — daglig kl. 09:00</p>
          <p>✓ Purring 3 dager før — til de som ikke har svart</p>
        </div>
        <div className="mt-4">
          <SendTestKnapp />
        </div>
      </div>

      {/* Varselhistorikk */}
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--aksent-lys)' }}>Siste varsler</h2>
      {!logg || logg.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--tekst-dempet)' }}>Ingen varsler sendt ennå.</p>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {logg.map((v, i) => (
            <div key={v.id} className="flex items-center justify-between px-4 py-2.5 text-xs"
              style={{
                background: i % 2 === 0 ? 'var(--bakgrunn-kort)' : 'var(--bakgrunn)',
                borderTop: i > 0 ? '1px solid var(--border)' : undefined,
              }}>
              <div>
                <p style={{ color: 'var(--tekst)' }}>{typeLabels[v.type] ?? v.type}</p>
                <p style={{ color: 'var(--tekst-dempet)' }}>
                  {v.arrangementer?.tittel}
                </p>
              </div>
              <p style={{ color: 'var(--tekst-dempet)' }}>
                {v.sendt_at ? format(new Date(v.sendt_at), 'd. MMM HH:mm', { locale: nb }) : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
