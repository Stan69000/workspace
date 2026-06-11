import { Suspense } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ActeurCard } from '@/components/public/ActeurCard'
import { Card } from '@/components/ui/Card'
import { formatDate, formatDateRelative } from '@/lib/utils'
import { PushNotifButton } from '@/components/public/PushNotifButton'
import { AlerteBanner } from '@/components/public/AlerteBanner'
import { MeteoWidget } from '@/components/public/MeteoWidget'

export const revalidate = 300 // 5 min

export default async function HomePage() {
  const [acteursRecents, prochainEvenement, derniereActus] = await Promise.all([
    prisma.acteur.findMany({
      where: { statut: 'PUBLIE' },
      take: 3,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, slug: true, nom: true, emoji: true, description: true,
        adresse: true, telephone: true,
        statut: true,
        categorie: { select: { nom: true, slug: true, emoji: true } },
        photos: { take: 1, select: { url: true, alt: true }, orderBy: { ordre: 'asc' } },
      },
    }),
    prisma.evenement.findFirst({
      where: { statut: 'PUBLIE', dateDebut: { gte: new Date() } },
      orderBy: { dateDebut: 'asc' },
      include: { acteur: { select: { nom: true, slug: true } } },
    }),
    prisma.actu.findMany({
      where: { statut: 'PUBLIE' },
      take: 3,
      orderBy: { publishedAt: 'desc' },
    }),
  ])

  return (
    <div className="space-y-12">
      {/* Alertes en cours */}
      <AlerteBanner />

      {/* Hero */}
      <section aria-labelledby="hero-titre">
        <div className="hero-section rounded-2xl bg-gradient-to-br from-village-600 to-village-800 px-8 py-14 text-white">
          <p className="text-sm font-medium uppercase tracking-wider text-white/90">Fleurieux-sur-l&apos;Arbresle</p>
          <h1 id="hero-titre" className="mt-2 text-4xl font-bold">
            Bienvenue dans notre village <span aria-hidden="true">🌿</span>
          </h1>
          <p className="mt-3 max-w-xl text-lg text-village-100">
            Retrouvez les commerces, associations, événements et sentiers de randonnée de Fleurieux.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/acteurs" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-village-700 hover:bg-village-50">
              Acteurs locaux
            </Link>
            <Link href="/agenda" className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
              Voir l&apos;agenda
            </Link>
            <PushNotifButton />
          </div>
        </div>
      </section>

      {/* Météo · heure · saint du jour */}
      <section aria-label="Météo locale">
        <Suspense fallback={null}>
          <MeteoWidget />
        </Suspense>
      </section>

      {/* Prochain événement */}
      {prochainEvenement && (
        <section aria-labelledby="evenement-titre">
          <h2 id="evenement-titre" className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Prochain événement</h2>
          <Link href="/agenda" aria-label={`Voir l'agenda — prochain événement : ${prochainEvenement.titre}`}>
            <Card hover className="flex items-start gap-4">
              <div className="min-w-[60px] rounded-lg bg-village-100 p-3 text-center dark:bg-village-900/30" aria-hidden="true">
                <p className="text-2xl font-bold text-village-700 dark:text-village-400">
                  {new Date(prochainEvenement.dateDebut).getDate()}
                </p>
                <p className="text-xs text-village-600 dark:text-village-400 capitalize">
                  {new Date(prochainEvenement.dateDebut).toLocaleDateString('fr-FR', { month: 'short' })}
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{prochainEvenement.titre}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{formatDateRelative(prochainEvenement.dateDebut)} · {prochainEvenement.lieu}</p>
                {prochainEvenement.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{prochainEvenement.description}</p>
                )}
              </div>
            </Card>
          </Link>
        </section>
      )}

      {/* Derniers acteurs ajoutés */}
      {acteursRecents.length > 0 && (
        <section aria-labelledby="une-titre">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="une-titre" className="text-xl font-bold text-gray-900 dark:text-gray-100">Derniers ajouts</h2>
            <Link
              href="/acteurs"
              aria-label="Voir tous les acteurs locaux"
              className="text-sm font-medium text-village-600 hover:underline dark:text-village-400"
            >
              Voir tout <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {acteursRecents.map(a => <ActeurCard key={a.id} acteur={a} />)}
          </div>
        </section>
      )}

      {/* Dernières actus */}
      {derniereActus.length > 0 && (
        <section aria-labelledby="actus-titre">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="actus-titre" className="text-xl font-bold text-gray-900 dark:text-gray-100">Actualités</h2>
            <Link
              href="/actus"
              aria-label="Voir toutes les actualités"
              className="text-sm font-medium text-village-600 hover:underline dark:text-village-400"
            >
              Voir tout <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {derniereActus.map(actu => (
              <Card key={actu.id} hover>
                {actu.source && <p className="text-sm font-medium text-village-600 dark:text-village-400">{actu.source}</p>}
                <h3 className="mt-1 font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{actu.titre}</h3>
                {actu.publishedAt && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{formatDate(actu.publishedAt)}</p>}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Liens rapides */}
      <section aria-label="Accès rapide aux rubriques">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { href: '/acteurs',   emoji: '🏪', label: 'Acteurs' },
            { href: '/agenda',    emoji: '📅', label: 'Agenda' },
            { href: '/randos',    emoji: '🥾', label: 'Randonnées' },
            { href: '/actus',     emoji: '📰', label: 'Actualités' },
          ].map(({ href, emoji, label }) => (
            <Link key={href} href={href}>
              <Card hover className="flex flex-col items-center gap-2 py-6 text-center">
                <span className="text-3xl" aria-hidden="true">{emoji}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
