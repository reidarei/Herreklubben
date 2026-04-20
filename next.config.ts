import type { NextConfig } from 'next'
import pkg from './package.json' with { type: 'json' }
import versjon from './lib/versjon.json' with { type: 'json' }

// App-versjon leses fra lib/versjon.json, som genereres lokalt av
// scripts/stamp-versjon.mjs (npm run stamp-versjon) før push. Dette
// sikrer at versjonen er korrekt på Vercel, hvor shallow git-clone
// gjør at direkte git-count ved build ikke fungerer.
// Fallback: hvis filen mangler innhold, bruk pkg.version direkte.
function appVersjon(): string {
  return versjon.versjon || `V${pkg.version}`
}

const nextConfig: NextConfig = {
  env: {
    BUILD_TIMESTAMP: new Date().toLocaleString('nb-NO', { timeZone: 'Europe/Oslo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
    APP_VERSION: appVersjon(),
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
