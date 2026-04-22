import { createServerClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { formaterDato, TIDSSONE } from '@/lib/dato'

// Escape for .ics TEXT-verdier: backslash, semikolon, komma og linjeskift
function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n')
}

// Formatter til .ics lokal tid i norsk tidssone: YYYYMMDDTHHMMSS
function formatIcsDate(iso: string): string {
  return formaterDato(iso, "yyyyMMdd'T'HHmmss")
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: arr } = await supabase
    .from('arrangementer')
    .select('id, tittel, beskrivelse, start_tidspunkt, slutt_tidspunkt, oppmoetested, destinasjon')
    .eq('id', id)
    .single()

  if (!arr) return new NextResponse('Not found', { status: 404 })

  const sluttIso = arr.slutt_tidspunkt
    ?? new Date(new Date(arr.start_tidspunkt).getTime() + 2 * 60 * 60 * 1000).toISOString()

  const beskrivelseDeler: string[] = []
  if (arr.beskrivelse) beskrivelseDeler.push(arr.beskrivelse)
  // Destinasjon tas med hvis den finnes — ingen type-sjekk. Møter har alltid null her.
  if (arr.destinasjon) beskrivelseDeler.push(`Destinasjon: ${arr.destinasjon}`)
  beskrivelseDeler.push(`https://mortensrudherreklubb.no/arrangementer/${id}`)

  const linjer = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mortensrud Herreklubb//NO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `BEGIN:VTIMEZONE`,
    `TZID:${TIDSSONE}`,
    `END:VTIMEZONE`,
    'BEGIN:VEVENT',
    `UID:${id}@mortensrudherreklubb.no`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;TZID=${TIDSSONE}:${formatIcsDate(arr.start_tidspunkt)}`,
    `DTEND;TZID=${TIDSSONE}:${formatIcsDate(sluttIso)}`,
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
