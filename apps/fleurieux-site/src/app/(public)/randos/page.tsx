import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { moduleActif } from '@/lib/modules'

export const metadata: Metadata = { title: 'Randonnées' }
export const revalidate = 3600

const DIFFICULTE_COLOR: Record<string, 'green' | 'yellow' | 'red'> = {
  FACILE: 'green', INTERMEDIAIRE: 'yellow', DIFFICILE: 'red',
}
const DIFFICULTE_LABEL: Record<string, string> = {
  FACILE: 'Facile', INTERMEDIAIRE: 'Intermédiaire', DIFFICILE: 'Difficile',
}

export default async function RandosPage() {
  if (!(await moduleActif('randos'))) notFound()

  const randos = await prisma.rando.findMany({
    where: { statut: 'PUBLIE' },
    orderBy: { difficulte: 'asc' },
    include: { photos: { take: 1, orderBy: { ordre: 'asc' } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Randonnées</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">{randos.length} sentier{randos.length > 1 ? 's' : ''} balisé{randos.length > 1 ? 's' : ''}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {randos.map(rando => (
          <Link key={rando.id} href={`/randos/${rando.slug}`}>
            <Card hover className="h-full flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">{rando.nom}</h2>
                <Badge variant={DIFFICULTE_COLOR[rando.difficulte]}>{DIFFICULTE_LABEL[rando.difficulte]}</Badge>
              </div>

              {rando.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{rando.description}</p>
              )}

              <div className="mt-auto flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                {rando.distanceKm && <span><span aria-hidden="true">📏 </span>{rando.distanceKm} km</span>}
                {rando.dureeMinutes && <span><span aria-hidden="true">⏱ </span>{Math.floor(rando.dureeMinutes / 60)}h{rando.dureeMinutes % 60 > 0 ? `${rando.dureeMinutes % 60}` : ''}</span>}
                {rando.deniveleM && <span><span aria-hidden="true">↗ </span>{rando.deniveleM} m de dénivelé</span>}
              </div>

              {rando.depart && <p className="text-sm text-gray-600 dark:text-gray-400">Départ : {rando.depart}</p>}
              {rando.sourceNom && (
                <p className="text-xs text-gray-400">
                  {rando.noteSource ? `${rando.noteSource.toFixed(1)}/5 · ` : ''}via {rando.sourceNom}
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
