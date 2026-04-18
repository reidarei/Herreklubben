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
  { href: '/', label: 'Agenda', ikon: CalendarIcon },
  { href: '/klubbinfo', label: 'Klubb', ikon: InformationCircleIcon },
  { href: '/kaaringer', label: 'Kåringer', ikon: TrophyIcon },
  { href: '/profil', label: 'Profil', ikon: UserIcon },
]

export default function BottomNav({ erAdmin }: { erAdmin: boolean }) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed z-50"
      style={{
        bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(min(100%, 32rem) - 32px)',
        background: 'rgba(12, 12, 16, 0.7)',
        backdropFilter: 'blur(20px) saturate(200%) brightness(1.1)',
        WebkitBackdropFilter: 'blur(20px) saturate(200%) brightness(1.1)',
        border: '0.5px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '22px',
        boxShadow:
          '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 0.5px 0 rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Top glint */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '10%',
          right: '10%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
          borderRadius: '1px',
        }}
      />

      <div className="flex items-center">
        {tabs.map((tab, i) => {
          const aktiv = tab.href === '/'
            ? pathname === '/'
            : pathname.startsWith(tab.href)
          const Ikon = tab.ikon
          const erProfil = tab.href === '/profil'

          return (
            <span key={tab.href} className="flex-1 flex items-center justify-center" style={{ position: 'relative' }}>
              {/* Hairline separator før profil */}
              {erProfil && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    bottom: '20%',
                    width: '0.5px',
                    background: 'rgba(255, 255, 255, 0.08)',
                  }}
                />
              )}
              <Link
                href={tab.href}
                className="flex flex-col items-center gap-1 active:scale-90 transition-transform duration-75 w-full"
                style={{
                  paddingTop: '10px',
                  paddingBottom: '10px',
                  color: aktiv ? 'var(--accent)' : 'var(--text-tertiary)',
                  textDecoration: 'none',
                  fontSize: '10px',
                  fontWeight: 500,
                  position: 'relative',
                }}
              >
                {/* Aktiv tab glass-bubble */}
                {aktiv && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: '4px 8px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '0.5px solid rgba(255, 255, 255, 0.08)',
                    }}
                  />
                )}
                <Ikon className="w-[22px] h-[22px] relative z-10" strokeWidth={1.5} />
                <span className="relative z-10">{tab.label}</span>
              </Link>
            </span>
          )
        })}
      </div>
    </nav>
  )
}
