'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarIcon,
  InformationCircleIcon,
  TrophyIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

const tabs = [
  { href: '/', label: 'Hjem', ikon: CalendarIcon },
  { href: '/klubbinfo', label: 'Klubbinfo', ikon: InformationCircleIcon },
  { href: '/kaaringer', label: 'Kåringer', ikon: TrophyIcon },
  { href: '/profil', label: 'Profil', ikon: UserIcon },
]

export default function BottomNav({ erAdmin }: { erAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed z-50"
      style={{
        bottom: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(min(100%, 32rem) - 32px)',
        background: 'rgba(30,30,30,0.88)',
        backdropFilter: 'saturate(180%) blur(24px)',
        WebkitBackdropFilter: 'saturate(180%) blur(24px)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        borderRadius: '22px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 0.5px 0 rgba(255,255,255,0.05)',
      }}
    >
      <div
        className="flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {tabs.map((tab) => {
          const aktiv = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          const Ikon = tab.ikon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center py-2.5 gap-1 transition-colors active:scale-90 transition-transform duration-75"
              style={{
                color: aktiv ? 'var(--accent)' : 'var(--text-tertiary)',
                textDecoration: 'none',
                fontSize: '10px',
                fontWeight: 500,
              }}
            >
              <Ikon className="w-[22px] h-[22px]" strokeWidth={1.5} />
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
