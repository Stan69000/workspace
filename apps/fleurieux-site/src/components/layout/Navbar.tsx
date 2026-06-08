'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DarkModeToggle } from '@/components/ui/DarkModeToggle'
import { SearchBar } from '@/components/ui/SearchBar'

const LINKS = [
  { href: '/acteurs', label: 'Acteurs' },
  { href: '/agenda',  label: 'Agenda' },
  { href: '/randos',  label: 'Randonnées' },
  { href: '/actus',   label: 'Actualités' },
  { href: '/transports', label: 'Transports' },
]

const NAV_LINK_CLASS = 'rounded-md px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100 aria-[current=page]:text-village-700 aria-[current=page]:bg-village-50 dark:aria-[current=page]:text-village-400 dark:aria-[current=page]:bg-village-900/20'
const NAV_LINK_MOBILE_CLASS = 'whitespace-nowrap rounded-md px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 aria-[current=page]:text-village-700 aria-[current=page]:bg-village-50 dark:aria-[current=page]:text-village-400 dark:aria-[current=page]:bg-village-900/20'

export function Navbar() {
  const pathname = usePathname()

  function isCurrent(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-village-700 dark:text-village-400">
          <span className="text-2xl" aria-hidden="true">🌿</span>
          <span className="hidden sm:block">Fleurieux</span>
          <span className="sr-only sm:hidden">Fleurieux</span>
        </Link>

        <nav aria-label="Menu principal" className="hidden flex-1 items-center gap-1 sm:flex">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isCurrent(l.href) ? 'page' : undefined}
              className={NAV_LINK_CLASS}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <SearchBar globalSearch placeholder="Recherche..." className="hidden w-48 md:flex" />
          <DarkModeToggle />
        </div>
      </div>

      {/* Mobile nav */}
      <nav aria-label="Navigation mobile" className="flex items-center gap-1 overflow-x-auto border-t border-gray-100 px-4 pb-2 pt-1 sm:hidden dark:border-gray-800">
        {LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isCurrent(l.href) ? 'page' : undefined}
            className={NAV_LINK_MOBILE_CLASS}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
