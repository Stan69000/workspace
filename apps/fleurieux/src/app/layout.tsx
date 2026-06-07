import type { Metadata, Viewport } from 'next'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Script src="/theme-init.js" strategy="afterInteractive" />
        {children}
      </body>
    </html>
  )
}
