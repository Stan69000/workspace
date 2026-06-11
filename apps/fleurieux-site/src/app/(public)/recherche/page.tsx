import type { Metadata } from 'next'
import Link from 'next/link'
import { searchAll, type SearchHit } from '@/lib/search'
import { SearchBar } from '@/components/ui/SearchBar'

export const metadata: Metadata = { title: 'Recherche' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ q?: string }>
}

const GROUPES = [
  { key: 'acteurs',    titre: 'Acteurs',     emoji: '🏪', href: (h: SearchHit) => `/acteurs/${h.slug}` },
  { key: 'evenements', titre: 'Agenda',      emoji: '📅', href: () => '/agenda' },
  { key: 'randos',     titre: 'Randonnées',  emoji: '🥾', href: (h: SearchHit) => `/randos/${h.slug}` },
  { key: 'actus',      titre: 'Actualités',  emoji: '📰', href: () => '/actus' },
] as const

export default async function RecherchePage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = (q ?? '').toString().trim()
  const results = query ? await searchAll(query) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recherche</h1>
        <SearchBar
          globalSearch
          defaultValue={query}
          placeholder="Rechercher un acteur, un événement, une rando…"
          className="mt-3 max-w-xl"
        />
      </div>

      {!query && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Saisissez un mot-clé pour rechercher parmi les acteurs, l’agenda, les randonnées et les actualités.
        </p>
      )}

      {results && (
        <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
          {results.total} résultat{results.total > 1 ? 's' : ''} pour «&nbsp;{query}&nbsp;»
        </p>
      )}

      {results && results.total === 0 && (
        <p className="text-gray-600 dark:text-gray-400">
          Aucun résultat. Vérifiez l’orthographe ou essayez un mot-clé plus court.
        </p>
      )}

      {results && GROUPES.map(g => {
        const hits = results[g.key]
        if (hits.length === 0) return null
        return (
          <section key={g.key} aria-labelledby={`grp-${g.key}`}>
            <h2 id={`grp-${g.key}`} className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
              <span aria-hidden="true">{g.emoji} </span>{g.titre} <span className="text-sm font-normal text-gray-400">({hits.length})</span>
            </h2>
            <ul className="space-y-2">
              {hits.map(h => (
                <li key={`${g.key}-${h.slug}`}>
                  <Link
                    href={g.href(h)}
                    className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-village-400 hover:bg-village-50/40 dark:border-gray-800 dark:hover:bg-village-900/10"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{h.titre}</span>
                      {h.meta && <span className="shrink-0 text-xs text-village-600 dark:text-village-400">{h.meta}</span>}
                    </div>
                    {h.sous && (
                      <p className="mt-0.5 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">{h.sous}</p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
