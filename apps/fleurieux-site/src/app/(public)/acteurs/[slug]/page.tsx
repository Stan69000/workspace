import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { OuvertMaintenant } from '@/components/public/OuvertMaintenant'
import { Badge } from '@/components/ui/Badge'
import { JOURS_FR } from '@/lib/utils'
import { localBusinessSchema } from '@/lib/schema-org'
import { CommentVenirClient } from '@/components/public/CommentVenirClient'
import { IconMapPin, IconPhone, IconMail, IconGlobe, IconInstagram } from '@/components/ui/icons'

interface Props { params: Promise<{ slug: string }> }

async function getActeur(slug: string) {
  return prisma.acteur.findUnique({
    where: { slug, statut: 'PUBLIE' },
    include: {
      categorie: true,
      horaires: { orderBy: { jour: 'asc' } },
      photos: { orderBy: { ordre: 'asc' } },
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
          </div>
          <OuvertMaintenant horaires={acteur.horaires} horairesNote={acteur.horairesNote} />
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            {acteur.descriptionLongue && (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="whitespace-pre-line">{acteur.descriptionLongue}</p>
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

          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Infos contact */}
            <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700 space-y-2">
              {acteur.adresse && (
                <p className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
                  <span className="sr-only">Adresse : </span>
                  <span>{acteur.adresse}, {acteur.codePostal} {acteur.ville}</span>
                </p>
              )}
              {acteur.telephone && (
                <p className="text-sm">
                  <a href={`tel:${acteur.telephone}`} className="flex items-center gap-2 text-village-600 hover:underline dark:text-village-400">
                    <IconPhone className="h-4 w-4 shrink-0" />
                    <span className="sr-only">Téléphone : </span>
                    {acteur.telephone}
                  </a>
                </p>
              )}
              {acteur.email && (
                <p className="text-sm">
                  <a href={`mailto:${acteur.email}`} className="flex items-center gap-2 text-village-600 hover:underline dark:text-village-400">
                    <IconMail className="h-4 w-4 shrink-0" />
                    <span className="sr-only">E-mail : </span>
                    {acteur.email}
                  </a>
                </p>
              )}
              {acteur.siteWeb && (
                <p className="text-sm">
                  <a href={acteur.siteWeb} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-village-600 hover:underline dark:text-village-400">
                    <IconGlobe className="h-4 w-4 shrink-0" />Site web
                    <span className="sr-only">(ouvre dans un nouvel onglet)</span>
                  </a>
                </p>
              )}
              {acteur.instagram && (
                <p className="text-sm">
                  <a href={acteur.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-village-600 hover:underline dark:text-village-400">
                    <IconInstagram className="h-4 w-4 shrink-0" />Instagram
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
