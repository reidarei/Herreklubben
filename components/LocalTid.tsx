'use client'

import { format } from 'date-fns'
import { nb } from 'date-fns/locale'

export default function LocalTid({ iso, formatStr }: { iso: string; formatStr: string }) {
  return <>{format(new Date(iso), formatStr, { locale: nb })}</>
}
