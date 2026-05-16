'use server'

import { ensureInnlogget } from '@/lib/auth'
import { naa } from '@/lib/dato'

/**
 * Marker at brukeren har sett klubb-chat nå. Kalles fra /chat-siden ved
 * server-render — fjerner ulest-prikken på Chat-tab neste gang headeren
 * rendres (f.eks. ved navigasjon til en annen tab og tilbake).
 */
export async function markerChatSett() {
  const { supabase, user } = await ensureInnlogget()
  await supabase
    .from('profiles')
    .update({ chat_sist_sett: naa() })
    .eq('id', user.id)
}
