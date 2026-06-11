import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { AlerteBanner } from '@/components/public/AlerteBanner'
import { NotificationPreferences } from '@/components/public/NotificationPreferences'
import { prochaineCollecte, TYPE_DECHET_LABEL, FREQUENCE_LABEL } from '@/lib/collecte'
import { getModules } from '@/lib/modules'
import { formatDateRelative } from '@/lib/utils'

const JOUR_LABEL: Record<string, string> = {
  LUNDI: 'lundi', MARDI: 'mardi', MERCREDI: 'mercredi', JEUDI: 'jeudi',
  VENDREDI: 'vendredi', SAMEDI: 'samedi', DIMANCHE: 'dimanche',
}

export const metadata: Metadata = { title: 'Infos pratiques' }
export const revalidate = 300

const CAT_NUM = [
  { key: 'URGENCE',   titre: 'Urgences',   emoji: '🚨' },
  { key: 'MAIRIE',    titre: 'Mairie & services', emoji: '🏛️' },
  { key: 'SANTE',     titre: 'Santé',      emoji: '⚕️' },
  { key: 'DECHETS',   titre: 'Déchets',    emoji: '♻️' },
  { key: 'TRANSPORT', titre: 'Transports', emoji: '🚌' },
  { key: 'AUTRE',     titre: 'Autres',     emoji: '📌' },
] as const

export default async function InfosPratiquesPage() {
  const modules = await getModules()
  if (modules['infos-pratiques'] === false) notFound()

  const [numeros, collectes] = await Promise.all([
    prisma.numeroUtile.findMany({ orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }, { nom: 'asc' }] }),
    prisma.collecteDechets.findMany({ where: { actif: true }, orderBy: { ordre: 'asc' } }),
  ])
  const parCat = (k: string) => numeros.filter(n => n.categorie === k)

  const prochaines = collectes
    .map(c => ({ type: c.type as string, date: prochaineCollecte(c) }))
    .filter((p): p is { type: string; date: Date } => p.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Infos pratiques</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Numéros utiles, alertes, gardes et services du quotidien à Fleurieux-sur-l’Arbresle.
        </p>
      </div>

      <AlerteBanner limit={5} />

      {/* Notifications */}
      <section aria-labelledby="notif-titre">
        <h2 id="notif-titre" className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Notifications</h2>
        <Card><NotificationPreferences /></Card>
      </section>

      {/* Numéros utiles */}
      <section aria-labelledby="num-titre" className="space-y-4">
        <h2 id="num-titre" className="font-semibold text-gray-900 dark:text-gray-100">Numéros utiles</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {CAT_NUM.map(cat => {
            const items = parCat(cat.key)
            if (items.length === 0) return null
            return (
              <Card key={cat.key}>
                <h3 className="mb-2 text-sm font-semibold text-village-700 dark:text-village-400">
                  <span aria-hidden="true">{cat.emoji} </span>{cat.titre}
                </h3>
                <ul className="space-y-1.5">
                  {items.map(n => (
                    <li key={n.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {n.nom}
                        {n.description && <span className="block text-xs text-gray-400">{n.description}</span>}
                      </span>
                      <a href={`tel:${n.numero.replace(/\s/g, '')}`} className="shrink-0 font-medium text-village-600 hover:underline dark:text-village-400">
                        {n.numero}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Gardes */}
      <section aria-labelledby="garde-titre" className="space-y-3">
        <h2 id="garde-titre" className="font-semibold text-gray-900 dark:text-gray-100">Pharmacie & médecin de garde</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pharmacie de garde</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Composez le <a href="tel:3237" className="font-medium text-village-600 hover:underline">32 37</a> ou consultez
              {' '}<a href="https://www.3237.fr" target="_blank" rel="noopener noreferrer" className="text-village-600 hover:underline">3237.fr</a>.
            </p>
          </Card>
          <Card>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Médecin de garde</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Appelez le <a href="tel:116117" className="font-medium text-village-600 hover:underline">116 117</a> (soir et week-end).
              En cas d’urgence vitale, le <a href="tel:15" className="font-medium text-village-600 hover:underline">15</a>.
            </p>
          </Card>
        </div>
      </section>

      {/* Déchets */}
      <section aria-labelledby="dechets-titre" className="space-y-3">
        <h2 id="dechets-titre" className="font-semibold text-gray-900 dark:text-gray-100">Collecte des déchets</h2>
        {prochaines.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {prochaines.slice(0, 4).map((p, i) => (
              <Card key={i} className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-gray-100">{TYPE_DECHET_LABEL[p.type] ?? p.type}</span>
                <span className="text-sm capitalize text-village-600 dark:text-village-400">{formatDateRelative(p.date)}</span>
              </Card>
            ))}
          </div>
        )}
        <Card className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          {collectes.length > 0 && (
            <ul className="space-y-1">
              {collectes.map(c => (
                <li key={c.id}>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{TYPE_DECHET_LABEL[c.type] ?? c.type}</span>
                  {' '}: {JOUR_LABEL[c.jour]} ({FREQUENCE_LABEL[c.frequence]})
                </li>
              ))}
            </ul>
          )}
          <p>
            Bac à <strong>couvercle gris</strong> = ordures ménagères · bac à <strong>couvercle jaune</strong> = emballages et papiers.
            Sortez le bac la veille au soir. Le <strong>verre</strong> se dépose dans les conteneurs d’apport volontaire du village.
          </p>
          <p>
            <strong>Déchèterie de Fleurieux</strong> (carte d’accès obligatoire) : lun, mer, jeu, ven 9h-12h et 14h-17h (18h du 1ᵉʳ avril au 30 septembre) ; sam 9h-17h.
          </p>
          <p>
            Calendrier officiel :{' '}
            <a href="https://www.paysdelarbresle.fr/wp-content/uploads/2025/12/calendrier-Fleurieux-Eveux-2026-bdef.pdf" target="_blank" rel="noopener noreferrer" className="text-village-600 hover:underline">calendrier 2026 Fleurieux/Éveux (PDF)</a>
            {' · '}
            <a href="https://www.paysdelarbresle.fr/agir-pour-lenvironnement/dechets-menagers/" target="_blank" rel="noopener noreferrer" className="text-village-600 hover:underline">Pays de L’Arbresle</a>.
            Service Déchets : <a href="tel:0474016890" className="text-village-600 hover:underline">04 74 01 68 90</a>.
          </p>
        </Card>
      </section>

      {/* Signaler */}
      {modules['signalement'] !== false && (
      <section aria-labelledby="signaler-titre" className="space-y-3">
        <h2 id="signaler-titre" className="font-semibold text-gray-900 dark:text-gray-100">Signaler un problème</h2>
        <Card>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Éclairage en panne, dépôt sauvage, nid-de-poule… signalez-le à la mairie en quelques secondes.
          </p>
          <Link href="/signaler" className="mt-3 inline-flex rounded-lg bg-village-600 px-4 py-2 text-sm font-semibold text-white hover:bg-village-700">
            Faire un signalement
          </Link>
        </Card>
      </section>
      )}
    </div>
  )
}
