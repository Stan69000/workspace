import { prisma } from '@/lib/prisma'
import { ActeursExplorer } from '@/components/public/ActeursExplorer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Acteurs locaux' }
export const revalidate = 300

export default async function ActeursPage() {
  const [acteurs, categories] = await Promise.all([
    prisma.acteur.findMany({
      where: { statut: 'PUBLIE' },
      orderBy: [{ miseEnAvant: 'desc' }, { noteAverage: 'desc' }],
      select: {
        id: true, slug: true, nom: true, emoji: true, description: true,
        adresse: true, telephone: true, noteAverage: true, nbAvis: true,
        statut: true, miseEnAvant: true, latitude: true, longitude: true,
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
      </div>
      <ActeursExplorer acteurs={acteurs} categories={categories} />
    </div>
  )
}
