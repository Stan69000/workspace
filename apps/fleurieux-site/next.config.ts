// next.config.ts
import type { NextConfig } from 'next'
import withPWA from '@ducanh2912/next-pwa'
import path from 'path'

const nextConfig: NextConfig = {
  output: 'standalone',

  // Monorepo : fixe la racine de file-tracing pour éviter l'inférence (warning multi-lockfiles)
  outputFileTracingRoot: path.resolve(__dirname, '../..'),

  serverExternalPackages: ['@prisma/client', 'prisma'],

  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      kysely: path.resolve('./src/kysely-mock.js'),
      'kysely/migration': path.resolve('./src/kysely-mock.js'),
    }
    return config
  },

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'fleurieux.info' },
    ],
  },

  // Headers statiques (CSP avec nonce gérée dans middleware.ts)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  workboxOptions: { skipWaiting: true },
})(nextConfig)
