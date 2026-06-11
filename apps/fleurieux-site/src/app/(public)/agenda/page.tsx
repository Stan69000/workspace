import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { moduleActif } from '@/lib/modules'
import { formatDate, formatDateRelative } from '@/lib/utils'

export const metadata: Metadata = { title: 'Agenda' }
export const revalidate = 300

export default async function AgendaPage() {
  if (!(await moduleActif('agenda'))) notFound()

  const evenements = await prisma.evenement.findMany({
    where: { statut: 'PUBLIE', dateDebut: { gte: new Date() } },
    orderBy: { dateDebut: 'asc' },
    take: 50,
    include: { acteur: { select: { nom: true, slug: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Agenda</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{evenements.length} événement{evenements.length > 1 ? 's' : ''} à venir</p>
        </div>
        <a
          href="/api/agenda/export"
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          download="agenda-fleurieux.ics"
        >
          <span aria-hidden="true">📅 </span>Exporter en iCal
          <span className="sr-only">(téléchargement du fichier agenda)</span>
        </a>
      </div>

      {evenements.length === 0 ? (
        <p className="py-16 text-center text-gray-600 dark:text-gray-400">Aucun événement à venir pour l&apos;instant.</p>
      ) : (
        <div className="space-y-3">
          {evenements.map(evt => (
            <Card key={evt.id} hover className="flex items-start gap-4">
              <div className="min-w-[64px] rounded-lg bg-village-50 p-3 text-center dark:bg-village-900/20">
                <p className="text-2xl font-bold leading-none text-village-700 dark:text-village-400">
                  {new Date(evt.dateDebut).getDate()}
                </p>
                <p className="text-sm capitalize text-village-600 dark:text-village-400">
                  {new Date(evt.dateDebut).toLocaleDateString('fr-FR', { month: 'short' })}
                </p>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">{evt.titre}</h2>
                  {evt.gratuit && <Badge variant="green">Gratuit</Badge>}
                  {evt.prix && !evt.gratuit && <Badge variant="blue">{evt.prix}</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                  {formatDateRelative(evt.dateDebut)}
                  {evt.lieu ? ` · ${evt.lieu}` : ''}
                  {evt.acteur ? ` · ${evt.acteur.nom}` : ''}
                </p>
                {evt.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{evt.description}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {evt.lienInscription && (
                    <a href={evt.lienInscription} target="_blank" rel="noopener noreferrer"
                      className="inline-block text-sm font-medium text-village-600 hover:underline dark:text-village-400">
                      S&apos;inscrire <span aria-hidden="true">→</span>
                      <span className="sr-only">(ouvre dans un nouvel onglet)</span>
                    </a>
                  )}
                  <a href={`/api/agenda/export?ids=${evt.id}`} download={`${evt.slug}.ics`}
                    className="inline-block text-sm text-gray-500 hover:text-village-600 hover:underline dark:text-gray-400">
                    <span aria-hidden="true">＋ </span>Ajouter à mon agenda
                  </a>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
