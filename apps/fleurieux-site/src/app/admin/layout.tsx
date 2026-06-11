import Link from 'next/link'

const ADMIN_LINKS = [
  { href: '/admin', label: 'Tableau de bord' },
  { href: '/admin/alertes', label: 'Alertes' },
  { href: '/admin/annonces', label: 'Annonces' },
  { href: '/admin/signalements', label: 'Signalements' },
  { href: '/admin/dechets', label: 'Déchets' },
  { href: '/admin/acteurs/import', label: 'Import acteurs' },
  { href: '/admin/parametres', label: 'Paramètres' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href="/admin" className="font-semibold text-village-700 dark:text-village-400">Administration</Link>
          <nav aria-label="Navigation admin" className="flex flex-wrap gap-1 text-sm">
            {ADMIN_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className="rounded-md px-3 py-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                {l.label}
              </Link>
            ))}
          </nav>
          <Link href="/" className="ml-auto text-sm text-gray-500 hover:underline dark:text-gray-400">← Retour au site</Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  )
}
