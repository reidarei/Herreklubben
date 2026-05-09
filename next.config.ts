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
  // Server actions sin default body-grense på 1 MB er for liten for
  // video-opplasting. Vi gir 52 MB — litt slack over MAKS_BYTES (50 MB)
  // i video-opplasting.ts slik at multipart-overhead ikke spiser av grensa.
  // NB: I Next 15.5.x ligger `serverActions` fortsatt under `experimental`
  // i config-schemaet. Top-level-plassering gir warning «Unrecognized key».
  experimental: {
    serverActions: {
      bodySizeLimit: '52mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Cloudflare R2 public dev URL — pub-{hash}.r2.dev
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      // Custom domain for R2 (når aktivert) — bilder.mortensrudherreklubb.no
      {
        protocol: 'https',
        hostname: 'bilder.mortensrudherreklubb.no',
      },
    ],
  },
}

export default nextConfig
