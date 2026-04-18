import type { Metadata, Viewport } from 'next'
import { Inter, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const viewport: Viewport = {
  viewportFit: 'cover',
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Mortensrud Herreklubb',
  description: 'Privat klubbapp for Mortensrud Herreklubb',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-180.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Herreklubben',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nb" className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <head>
        <meta name="theme-color" content="#060608" />
        <link rel="apple-touch-icon" href="/icon-180.png" />
      </head>
      <body>{children}<SpeedInsights /></body>
    </html>
  )
}
