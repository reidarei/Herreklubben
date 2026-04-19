import type { NextConfig } from 'next'
import { execSync } from 'node:child_process'
import pkg from './package.json' with { type: 'json' }

// App-versjon beregnes ved build: major fra package.json, minor = commit-
// count på main minus fast offset (180). Redesign-commit 7b6b806 (commit
// #181) er definert som V2.001, så offset = 180. Påfølgende deploys
// inkrementeres automatisk. Minor padded til 3 sifre (001, 015, 123).
// Historiske commits må ikke rebase-es vekk ellers blir nummereringen
// inkonsistent. Fallback til ren pkg.version hvis git ikke er tilgjengelig
// under bygg.
function beregnVersjon(): string {
  try {
    const count = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10)
    const [major] = pkg.version.split('.')
    const minor = String(count - 180).padStart(3, '0')
    return `V${major}.${minor}`
  } catch {
    return `V${pkg.version}`
  }
}

const nextConfig: NextConfig = {
  env: {
    BUILD_TIMESTAMP: new Date().toLocaleString('nb-NO', { timeZone: 'Europe/Oslo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    APP_VERSION: beregnVersjon(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
