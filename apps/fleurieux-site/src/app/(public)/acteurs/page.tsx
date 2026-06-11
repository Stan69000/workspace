import { prisma } from '@/lib/prisma'
import { ActeursExplorer } from '@/components/public/ActeursExplorer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Acteurs locaux' }
export const revalidate = 300

export default async function ActeursPage() {
  const [acteurs, categories] = await Promise.all([
    prisma.acteur.findMany({
      where: { statut: 'PUBLIE' },
      orderBy: { nom: 'asc' },
      select: {
        id: true, slug: true, nom: true, emoji: true, description: true,
        adresse: true, telephone: true,
        statut: true, latitude: true, longitude: true,
        horairesNote: true,
        categorie: { select: { nom: true, slug: true, emoji: true } },
        photos: { take: 1, select: { url: true, alt: true }, orderBy: { ordre: 'asc' } },
        horaires: { select: { jour: true, ouvert: true, ouverture: true, fermeture: true } },
      },
    }),
    prisma.categorie.findMany({ orderBy: { ordre: 'asc' } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Acteurs locaux</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {acteurs.length} acteur{acteurs.length > 1 ? 's' : ''} référencé{acteurs.length > 1 ? 's' : ''}
        </p>
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Données vérifiées via les sources officielles (SIRENE, RNA)
        </p>
      </div>
      <ActeursExplorer acteurs={acteurs} categories={categories} />
    </div>
  )
}
