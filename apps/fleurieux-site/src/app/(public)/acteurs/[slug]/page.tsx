import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { getModules } from '@/lib/modules'
import { requireStaff } from '@/lib/admin-guard'
import { OuvertMaintenant } from '@/components/public/OuvertMaintenant'
import { Badge } from '@/components/ui/Badge'
import { JOURS_FR } from '@/lib/utils'
import { localBusinessSchema } from '@/lib/schema-org'
import { CommentVenirClient } from '@/components/public/CommentVenirClient'
import { IconMapPin, IconPhone, IconMail, IconGlobe, IconInstagram } from '@/components/ui/icons'

const ETAT_MAJ_LABEL: Record<string, string> = {
  ACTIF: 'Actif',
  A_VERIFIER: 'À vérifier',
  MODIFIE: 'Infos modifiées',
  FERME: 'Fermé définitivement',
}

interface Props { params: Promise<{ slug: string }> }

// Sélection explicite : on n'expose JAMAIS contributeurId ni noteMaj au public
// (l'objet est sérialisé dans le payload de la page).
async function getActeur(slug: string) {
  return prisma.acteur.findUnique({
    where: { slug, statut: 'PUBLIE' },
    select: {
      slug: true, nom: true, emoji: true,
      description: true, descriptionLongue: true,
      adresse: true, codePostal: true, ville: true,
      telephone: true, email: true, siteWeb: true, instagram: true,
      latitude: true, longitude: true,
      accepteEspeces: true, accepteCB: true, accepteCheque: true, accepteVirement: true,
      horairesNote: true, etatMaj: true,
      categorie: { select: { emoji: true, nom: true } },
      horaires: { orderBy: { jour: 'asc' }, select: { jour: true, ouvert: true, ouverture: true, fermeture: true } },
      photos: { orderBy: { ordre: 'asc' }, select: { id: true, url: true, alt: true } },
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

  const modules = await getModules()
  const signalementActif = modules['signalement'] !== false
  const staff = await requireStaff(await headers())
  // noteMaj est une note interne : on ne la lit que pour le staff.
  const noteMaj = staff
    ? (await prisma.acteur.findUnique({ where: { slug }, select: { noteMaj: true } }))?.noteMaj ?? null
    : null
  const montrerEtatAdmin = Boolean(staff) && (acteur.etatMaj !== 'ACTIF' || Boolean(noteMaj))

  const baseUrl = process.env.NEXTAUTH_URL ?? 'https://fleurieux.info'
  const jsonLd = localBusinessSchema(acteur, `${baseUrl}/acteurs/${acteur.slug}`)

  // La fiche détail ne montrait que descriptionLongue : on retombe sur la
  // description courte si la longue est absente (cas le plus fréquent).
  const texte = acteur.descriptionLongue || acteur.description
  const hasPhotos = acteur.photos.length > 0
  const hasHoraires = acteur.horaires.length > 0
  const hasMainContent = Boolean(texte) || hasPhotos || hasHoraires

  const contribuerCta = signalementActif ? (
    <Link href="/signaler" className="font-medium text-village-600 hover:underline dark:text-village-400">
      Proposez une mise à jour
    </Link>
  ) : null

  const sidebar = (
    <div className="space-y-4">
      {/* Infos contact */}
      <div className="space-y-2 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
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
  )

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning>{JSON.stringify(jsonLd)}</script>

      <div className="space-y-8">
        {/* Bandeau état de MAJ — visible uniquement par le staff (admin/modérateur) */}
        {montrerEtatAdmin && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/30">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              <span aria-hidden="true">🛠️ </span>État de mise à jour (admin) : {ETAT_MAJ_LABEL[acteur.etatMaj] ?? acteur.etatMaj}
            </p>
            {noteMaj && (
              <p className="mt-0.5 whitespace-pre-line text-amber-800 dark:text-amber-300">{noteMaj}</p>
            )}
          </div>
        )}

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
          {acteur.etatMaj === 'FERME' ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
              <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
              Fermé définitivement
            </span>
          ) : (
            <OuvertMaintenant horaires={acteur.horaires} horairesNote={acteur.horairesNote} />
          )}
        </div>

        {hasMainContent ? (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Photos */}
              {hasPhotos && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {acteur.photos.map(p => (
                    <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                      <Image src={p.url} alt={p.alt ?? acteur.nom} fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
                    </div>
                  ))}
                </div>
              )}

              {/* Description (longue, ou courte en repli) */}
              {texte && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-line">{texte}</p>
                </div>
              )}

              {/* Horaires */}
              {hasHoraires && (
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

            {sidebar}
          </div>
        ) : (
          /* Fiche peu renseignée : colonne unique centrée, sans grand vide */
          <div className="mx-auto max-w-2xl space-y-6">
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Cette fiche est encore peu renseignée.</p>
              {signalementActif && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Vous gérez « {acteur.nom} » ? {contribuerCta}
                </p>
              )}
            </div>
            {sidebar}
          </div>
        )}

        {/* CTA contribuer (si le module signalement est actif) */}
        {hasMainContent && signalementActif && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-600">
            Une info à corriger ? {contribuerCta}
          </p>
        )}
      </div>
    </>
  )
}
