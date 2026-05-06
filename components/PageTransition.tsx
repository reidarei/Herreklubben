'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Scroll til toppen ved sidebytte. Next.js gjør dette normalt selv, men
  // kombinasjonen av key-basert remount og page-fadein-animasjonen kan i
  // praksis bevare scroll-posisjonen — vi setter den eksplisitt her.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}
