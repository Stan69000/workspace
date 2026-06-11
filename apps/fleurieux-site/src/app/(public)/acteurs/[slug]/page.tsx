import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { OuvertMaintenant } from '@/components/public/OuvertMaintenant'
import { Badge } from '@/components/ui/Badge'
import { formatEtoiles, JOURS_FR } from '@/lib/utils'
import { localBusinessSchema } from '@/lib/schema-org'
// Next 15 : ssr:false interdit dans un Server Component → on passe par le wrapper client.
import { CommentVenirClient } from '@/components/public/CommentVenirClient'

interface Props { params: Promise<{ slug: string }> }

async function getActeur(slug: string) {
  return prisma.acteur.findUnique({
    where: { slug, statut: 'PUBLIE' },
    include: {
      categorie: true,
      horaires: { orderBy: { jour: 'asc' } },
      photos: { orderBy: { ordre: 'asc' } },
      avis: { where: { statut: 'APPROUVE' }, orderBy: { createdAt: 'desc' }, take: 10 },
    },
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const acteur = await getActeur(slug)
  if (!acteur) return {}
  return {
    title: acteur.nom,
    description: acteur.description ?? undefined,
  }
}

export default async function ActeurPage({ params }: Props) {
  const { slug } = await params
  const acteur = await getActeur(slug)
  if (!acteur) notFound()

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://fleurieux.info'
  const jsonLd = localBusinessSchema(acteur, `${baseUrl}/acteurs/${acteur.slug}`)

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning>{JSON.stringify(jsonLd)}</script>

      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-village-600 dark:text-village-400">
              <span aria-hidden="true">{acteur.categorie.emoji} </span>{acteur.categorie.nom}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-gray-900 dark:text-gray-100">
              <span aria-hidden="true">{acteur.emoji} </span>{acteur.nom}
            </h1>
            {acteur.noteAverage && acteur.nbAvis > 0 && (
              <p className="mt-1 text-amber-500">
                <span aria-hidden="true">{formatEtoiles(acteur.noteAverage)}</span>
                <span className="sr-only">Note : {acteur.noteAverage.toFixed(1)} sur 5</span>
                {' '}<span className="text-sm text-gray-600 dark:text-gray-400">({acteur.nbAvis} avis)</span>
              </p>
            )}
          </div>
          <OuvertMaintenant horaires={acteur.horaires} horairesNote={acteur.horairesNote} />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            {acteur.descriptionLongue && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p>{acteur.descriptionLongue}</p>
              </div>
            )}

            {/* Horaires */}
            {acteur.horaires.length > 0 && (
              <div>
                <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Horaires</h2>
                <div className="space-y-1">
                  {acteur.horaires.map(h => (
                    <div key={h.jour} className="flex items-center justify-between text-sm">
                      <span className="w-28 font-medium text-gray-700 dark:text-gray-300">{JOURS_FR[h.jour]}</span>
                      {h.ouvert && h.ouverture && h.fermeture
                        ? <span className="text-gray-600 dark:text-gray-400">{h.ouverture} – {h.fermeture}</span>
                        : <span className="text-red-500">Fermé</span>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Avis */}
            {acteur.avis.length > 0 && (
              <div>
                <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Avis</h2>
                <div className="space-y-3">
                  {acteur.avis.map(avis => (
                    <div key={avis.id} className="rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400 text-sm">
                          <span aria-hidden="true">{formatEtoiles(avis.note)}</span>
                          <span className="sr-only">Note : {avis.note} sur 5</span>
                        </span>
                        {avis.prenomAuteur && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{avis.prenomAuteur}</span>}
                        {avis.estHabitant && <Badge variant="green">Habitant</Badge>}
                      </div>
                      {avis.texte && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{avis.texte}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Infos contact */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 space-y-2">
              {acteur.adresse && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span aria-hidden="true">📍 </span>
                  <span className="sr-only">Adresse : </span>
                  {acteur.adresse}, {acteur.codePostal} {acteur.ville}
                </p>
              )}
              {acteur.telephone && (
                <p className="text-sm">
                  <a href={`tel:${acteur.telephone}`} className="text-village-600 hover:underline dark:text-village-400">
                    <span aria-hidden="true">📞 </span>
                    <span className="sr-only">Téléphone : </span>
                    {acteur.telephone}
                  </a>
                </p>
              )}
              {acteur.email && (
                <p className="text-sm">
                  <a href={`mailto:${acteur.email}`} className="text-village-600 hover:underline dark:text-village-400">
                    <span aria-hidden="true">✉️ </span>
                    <span className="sr-only">E-mail : </span>
                    {acteur.email}
                  </a>
                </p>
              )}
              {acteur.siteWeb && (
                <p className="text-sm">
                  <a href={acteur.siteWeb} target="_blank" rel="noopener noreferrer" className="text-village-600 hover:underline dark:text-village-400">
                    <span aria-hidden="true">🌐 </span>Site web
                    <span className="sr-only">(ouvre dans un nouvel onglet)</span>
                  </a>
                </p>
              )}
              {/* Paiement */}
              <div className="flex flex-wrap gap-1 pt-1">
                {acteur.accepteEspeces  && <Badge>Espèces</Badge>}
                {acteur.accepteCB       && <Badge variant="blue">CB</Badge>}
                {acteur.accepteCheque   && <Badge>Chèque</Badge>}
                {acteur.accepteVirement && <Badge>Virement</Badge>}
              </div>
            </div>

            {/* Comment venir */}
            {acteur.latitude && acteur.longitude && (
              <div>
                <h2 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Comment venir</h2>
                <CommentVenirClient lat={acteur.latitude} lon={acteur.longitude} nom={acteur.nom} adresse={acteur.adresse} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
