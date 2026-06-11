import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CollecteForm } from '@/components/admin/CollecteForm'
import { CollecteActions } from '@/components/admin/AdminActions'
import { TYPE_DECHET_LABEL, FREQUENCE_LABEL } from '@/lib/collecte'

export const metadata: Metadata = { title: 'Déchets — Admin' }
export const dynamic = 'force-dynamic'

const JOUR_LABEL: Record<string, string> = {
  LUNDI: 'Lundi', MARDI: 'Mardi', MERCREDI: 'Mercredi', JEUDI: 'Jeudi',
  VENDREDI: 'Vendredi', SAMEDI: 'Samedi', DIMANCHE: 'Dimanche',
}

export default async function AdminDechetsPage() {
  const collectes = await prisma.collecteDechets.findMany({ orderBy: [{ actif: 'desc' }, { ordre: 'asc' }, { type: 'asc' }] })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Collecte des déchets</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configurez les jours de collecte. Un rappel push est envoyé aux abonnés la veille au soir (cron quotidien).
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Ajouter une collecte</h2>
        <Card><CollecteForm /></Card>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Planning ({collectes.length})</h2>
        {collectes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune collecte configurée.</p>
        ) : (
          <ul className="space-y-2">
            {collectes.map(c => (
              <li key={c.id}>
                <Card className={c.actif ? '' : 'opacity-60'}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="green">{TYPE_DECHET_LABEL[c.type] ?? c.type}</Badge>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {JOUR_LABEL[c.jour]} · {FREQUENCE_LABEL[c.frequence]}
                      </span>
                      {!c.actif && <span className="text-xs text-gray-400">(inactive)</span>}
                    </div>
                    <CollecteActions id={c.id} actif={c.actif} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
