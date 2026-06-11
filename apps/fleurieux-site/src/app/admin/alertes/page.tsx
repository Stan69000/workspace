import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AlerteForm } from '@/components/admin/AlerteForm'
import { AlerteActions } from '@/components/admin/AdminActions'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Alertes — Admin' }
export const dynamic = 'force-dynamic'

const NIVEAU: Record<string, { label: string; variant: 'blue' | 'yellow' | 'red' }> = {
  INFO: { label: 'Info', variant: 'blue' },
  IMPORTANT: { label: 'Important', variant: 'yellow' },
  URGENT: { label: 'Urgent', variant: 'red' },
}

export default async function AdminAlertesPage() {
  const alertes = await prisma.alerte.findMany({ orderBy: [{ actif: 'desc' }, { createdAt: 'desc' }], take: 60 })

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Alertes & infos du village</h1>

      <section>
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Nouvelle alerte</h2>
        <Card><AlerteForm /></Card>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Alertes ({alertes.length})</h2>
        {alertes.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune alerte pour le moment.</p>
        ) : (
          <ul className="space-y-2">
            {alertes.map(a => (
              <li key={a.id}>
                <Card className={a.actif ? '' : 'opacity-60'}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={NIVEAU[a.niveau]?.variant ?? 'blue'}>{NIVEAU[a.niveau]?.label ?? 'Info'}</Badge>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{a.titre}</span>
                        {!a.actif && <span className="text-xs text-gray-400">(inactive)</span>}
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{a.message}</p>
                      <p className="mt-1 text-xs text-gray-400">Publiée le {formatDate(a.createdAt)}</p>
                    </div>
                    <AlerteActions id={a.id} actif={a.actif} />
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
