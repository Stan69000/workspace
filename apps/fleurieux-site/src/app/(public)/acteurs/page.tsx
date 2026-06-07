import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { prisma } from '@/lib/prisma'
import { ActeurCard } from '@/components/public/ActeurCard'
import { SearchBar } from '@/components/ui/SearchBar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Acteurs locaux' }
export const revalidate = 300

const ActeursMap = dynamic(() => import('@/components/public/ActeursMap').then(m => m.ActeursMap), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Chargement de la carte"
      aria-busy="true"
      className="h-[420px] w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800"
    >
      <span className="sr-only">Chargement de la carte en cours…</span>
    </div>
  ),
})

interface Props {
  searchParams: Promise<{ q?: string; categorie?: string; vue?: string }>
}

export default async function ActeursPage({ searchParams }: Props) {
  const { q = '', categorie = '', vue = 'liste' } = await searchParams

  const [acteurs, categories] = await Promise.all([
    prisma.acteur.findMany({
      where: {
        statut: 'PUBLIE',
        ...(q && { OR: [
          { nom: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ]}),
        ...(categorie && { categorie: { slug: categorie } }),
      },
      orderBy: [{ miseEnAvant: 'desc' }, { noteAverage: 'desc' }],
      select: {
        id: true, slug: true, nom: true, emoji: true, description: true,
        adresse: true, telephone: true, noteAverage: true, nbAvis: true,
        statut: true, miseEnAvant: true, latitude: true, longitude: true,
        categorie: { select: { nom: true, slug: true, emoji: true } },
        photos: { take: 1, select: { url: true, alt: true }, orderBy: { ordre: 'asc' } },
      },
    }),
    prisma.categorie.findMany({ orderBy: { ordre: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Acteurs locaux</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">{acteurs.length} acteur{acteurs.length > 1 ? 's' : ''} référencé{acteurs.length > 1 ? 's' : ''}</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <SearchBar placeholder="Rechercher un acteur..." />
        </div>
        <div role="group" aria-label="Filtrer par catégorie" className="flex flex-wrap gap-2">
          <a
            href="/acteurs"
            aria-current={!categorie ? 'true' : undefined}
            className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${!categorie ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
          >
            Tous
          </a>
          {categories.map(cat => (
            <a
              key={cat.slug}
              href={`/acteurs?categorie=${cat.slug}`}
              aria-current={categorie === cat.slug ? 'true' : undefined}
              className={`rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${categorie === cat.slug ? 'bg-village-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
            >
              <span aria-hidden="true">{cat.emoji} </span>{cat.nom}
            </a>
          ))}
        </div>
        <div role="group" aria-label="Mode d'affichage" className="flex gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          <a
            href={`/acteurs?${new URLSearchParams({ q, categorie, vue: 'liste' })}`}
            aria-current={vue !== 'carte' ? 'true' : undefined}
            className={`rounded px-4 py-2.5 text-sm font-medium ${vue !== 'carte' ? 'bg-village-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
          >
            Liste
          </a>
          <a
            href={`/acteurs?${new URLSearchParams({ q, categorie, vue: 'carte' })}`}
            aria-current={vue === 'carte' ? 'true' : undefined}
            className={`rounded px-4 py-2.5 text-sm font-medium ${vue === 'carte' ? 'bg-village-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
          >
            Carte
          </a>
        </div>
      </div>

      {/* Vue carte */}
      {vue === 'carte' && (
        <ActeursMap acteurs={acteurs} />
      )}

      {/* Vue liste */}
      {vue !== 'carte' && (
        acteurs.length === 0 ? (
          <p className="py-16 text-center text-gray-600 dark:text-gray-400">Aucun acteur trouvé.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {acteurs.map(a => <ActeurCard key={a.id} acteur={a} />)}
          </div>
        )
      )}
    </div>
  )
}
