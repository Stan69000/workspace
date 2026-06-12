import type { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'

export const metadata: Metadata = { title: 'Dashboard Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const [
    acteursTotal,
    acteursPublies,
    evenementsTotal,
    evenementsAVenir,
    randosTotal,
    actusTotal,
    pushSubscriptions,
    annoncesEnAttente,
    signalementsNouveaux,
    alertesActives,
  ] = await Promise.all([
    prisma.acteur.count(),
    prisma.acteur.count({ where: { statut: 'PUBLIE' } }),
    prisma.evenement.count(),
    prisma.evenement.count({ where: { statut: 'PUBLIE', dateDebut: { gte: new Date() } } }),
    prisma.rando.count({ where: { statut: 'PUBLIE' } }),
    prisma.actu.count({ where: { statut: 'PUBLIE' } }),
    prisma.pushSubscription.count(),
    prisma.annonce.count({ where: { statut: 'EN_ATTENTE' } }),
    prisma.signalement.count({ where: { statut: 'NOUVEAU' } }),
    prisma.alerte.count({ where: { actif: true } }),
  ])

  const stats = [
    { label: 'Acteurs publiés', value: acteursPublies, total: acteursTotal, href: '/admin/acteurs', color: 'text-village-600' },
    { label: 'Événements à venir', value: evenementsAVenir, total: evenementsTotal, href: '/admin/agenda', color: 'text-blue-600' },
    { label: 'Alertes actives', value: alertesActives, href: '/admin/alertes', color: 'text-amber-600' },
    { label: 'Annonces à modérer', value: annoncesEnAttente, href: '/admin/annonces', color: annoncesEnAttente > 0 ? 'text-red-600' : 'text-gray-600' },
    { label: 'Signalements nouveaux', value: signalementsNouveaux, href: '/admin/signalements', color: signalementsNouveaux > 0 ? 'text-red-600' : 'text-gray-600' },
    { label: 'Randonnées', value: randosTotal, href: '/admin/randos', color: 'text-green-600' },
    { label: 'Actualités', value: actusTotal, href: '/admin/actus', color: 'text-orange-600' },
    { label: 'Abonnés push', value: pushSubscriptions, href: '#', color: 'text-purple-600' },
  ]

  const shortcuts = [
    { label: 'Publier une alerte', href: '/admin/alertes' },
    { label: 'Modérer les annonces', href: '/admin/annonces' },
    { label: 'Traiter les signalements', href: '/admin/signalements' },
    { label: 'Import / Export acteurs', href: '/admin/acteurs/import' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <Card hover className="text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              {stat.total !== undefined && stat.total !== stat.value && (
                <p className="text-xs text-gray-400">/ {stat.total}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Raccourcis</h2>
        <div className="flex flex-wrap gap-3">
          {shortcuts.map(s => (
            <Link
              key={s.label}
              href={s.href}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
