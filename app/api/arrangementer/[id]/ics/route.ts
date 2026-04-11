import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Escape for .ics TEXT-verdier: backslash, semikolon, komma og linjeskift
function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n')
}

// Formatter til .ics UTC-format: YYYYMMDDTHHMMSSZ
function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: arr } = await supabase
    .from('arrangementer')
    .select('id, type, tittel, beskrivelse, start_tidspunkt, slutt_tidspunkt, oppmoetested, destinasjon')
    .eq('id', id)
    .single()

  if (!arr) return new NextResponse('Not found', { status: 404 })

  const start = new Date(arr.start_tidspunkt)
  const slutt = arr.slutt_tidspunkt
    ? new Date(arr.slutt_tidspunkt)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2 timer default når ingen sluttid er satt

  const beskrivelseDeler: string[] = []
  if (arr.beskrivelse) beskrivelseDeler.push(arr.beskrivelse)
  if (arr.type === 'tur' && arr.destinasjon) beskrivelseDeler.push(`Destinasjon: ${arr.destinasjon}`)
  beskrivelseDeler.push(`https://mortensrudherreklubb.no/arrangementer/${id}`)

  const linjer = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mortensrud Herreklubb//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${id}@mortensrudherreklubb.no`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(slutt)}`,
    `SUMMARY:${escapeIcs(arr.tittel)}`,
    `DESCRIPTION:${escapeIcs(beskrivelseDeler.join('\n'))}`,
    ...(arr.oppmoetested ? [`LOCATION:${escapeIcs(arr.oppmoetested)}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const ics = linjer.join('\r\n')
  const filnavn = `herreklubben-${id.slice(0, 8)}.ics`

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filnavn}"`,
    },
  })
}
