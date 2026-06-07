import Link from 'next/link'
import { DarkModeToggle } from '@/components/ui/DarkModeToggle'
import { SearchBar } from '@/components/ui/SearchBar'

const LINKS = [
  { href: '/acteurs', label: 'Acteurs' },
  { href: '/agenda',  label: 'Agenda' },
  { href: '/randos',  label: 'Randos' },
  { href: '/actus',   label: 'Actus' },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-village-700 dark:text-village-400">
          <span className="text-2xl">🌿</span>
          <span className="hidden sm:block">Fleurieux</span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 sm:flex">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
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
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-gray-100 px-4 pb-2 pt-1 sm:hidden dark:border-gray-800">
        {LINKS.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
