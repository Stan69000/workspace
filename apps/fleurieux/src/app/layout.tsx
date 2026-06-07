import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import Script from 'next/script'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: { default: "Fleurieux-sur-l'Arbresle", template: "%s | Fleurieux" },
  description: "Portail de référence du village de Fleurieux-sur-l'Arbresle (69210) — acteurs locaux, agenda, randonnées, actualités.",
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Fleurieux' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? ''

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        {nonce && <meta name="x-nonce" content={nonce} />}
      </head>
      <body>
        {/* Applique le thème avant le rendu pour éviter le flash — script statique, pas d'interpolation utilisateur */}
        <Script src="/theme-init.js" strategy="beforeInteractive" nonce={nonce || undefined} />
        {children}
      </body>
    </html>
  )
}
