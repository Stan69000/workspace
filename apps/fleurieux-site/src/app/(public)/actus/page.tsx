import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { moduleActif } from '@/lib/modules'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Actualités' }
export const revalidate = 300

export default async function ActusPage() {
  if (!(await moduleActif('actus'))) notFound()

  const actus = await prisma.actu.findMany({
    where: { statut: 'PUBLIE' },
    orderBy: { publishedAt: 'desc' },
    take: 30,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Actualités</h1>

      {actus.length === 0 ? (
        <p className="py-16 text-center text-gray-600 dark:text-gray-400">Aucune actualité pour l&apos;instant.</p>
      ) : (
        <div className="space-y-4">
          {actus.map(actu => (
            <Card key={actu.id} hover>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {actu.source && (
                    <p className="text-sm font-medium uppercase tracking-wide text-village-600 dark:text-village-400">{actu.source}</p>
                  )}
                  <h2 className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{actu.titre}</h2>
                  {actu.contenu && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{actu.contenu}</p>
                  )}
                  {actu.lienExterne && (
                    <a
                      href={actu.lienExterne}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-village-600 hover:underline dark:text-village-400"
                    >
                      Lire la suite <span aria-hidden="true">→</span>
                      <span className="sr-only">(ouvre dans un nouvel onglet)</span>
                    </a>
                  )}
                </div>
                {actu.publishedAt && (
                  <p className="shrink-0 text-sm text-gray-600 dark:text-gray-400">{formatDate(actu.publishedAt)}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
