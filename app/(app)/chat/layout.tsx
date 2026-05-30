// Layout kun for /chat-ruten. Setter interactiveWidget='resizes-content'
// slik at iOS-tastaturet skyver opp hele layout-treet i stedet for å
// overlappe det. Kun /chat bruker dette — andre sider beholder
// 'overlays-content' fra root-layoutet (for å unngå resize-quirks på
// sider som ikke er fullskjerm-chat). Se issue #210 PR 2.
import type { Viewport } from 'next'

export const viewport: Viewport = {
  // resizes-content: iOS/Chrome skyver viewporten opp ved tastaturåpning.
  // Det fjerner behovet for keyboardOffset-juks i ChatV2.
  interactiveWidget: 'resizes-content',
  // cover: fyller hele skjermen inkl. notch — safe-area-inset-* håndterer
  // innrykk der det trengs.
  viewportFit: 'cover',
  maximumScale: 1,
  userScalable: false,
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
