import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SignalementStatus } from '@/components/admin/AdminActions'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Signalements — Admin' }
export const dynamic = 'force-dynamic'

const TYPE: Record<string, string> = {
  ECLAIRAGE: 'Éclairage', VOIRIE: 'Voirie', PROPRETE: 'Propreté',
  ESPACES_VERTS: 'Espaces verts', MOBILIER: 'Mobilier', AUTRE: 'Autre',
}
const STATUT: Record<string, { label: string; variant: 'red' | 'yellow' | 'green' | 'gray' }> = {
  NOUVEAU: { label: 'Nouveau', variant: 'red' },
  EN_COURS: { label: 'En cours', variant: 'yellow' },
  RESOLU: { label: 'Résolu', variant: 'green' },
  REFUSE: { label: 'Refusé', variant: 'gray' },
}

export default async function AdminSignalementsPage() {
  const signalements = await prisma.signalement.findMany({
    orderBy: [{ statut: 'asc' }, { createdAt: 'desc' }],
    take: 150,
  })
  const nouveaux = signalements.filter(s => s.statut === 'NOUVEAU').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Signalements</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {signalements.length} signalement{signalements.length > 1 ? 's' : ''}
          {nouveaux > 0 && <span className="text-red-600"> · {nouveaux} nouveau{nouveaux > 1 ? 'x' : ''}</span>}
        </p>
      </div>

      {signalements.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Aucun signalement.</p>
      ) : (
        <ul className="space-y-2">
          {signalements.map(s => (
            <li key={s.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUT[s.statut]?.variant ?? 'gray'}>{STATUT[s.statut]?.label ?? s.statut}</Badge>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{TYPE[s.type] ?? 'Autre'}</span>
                      {s.localisation && <span className="text-sm text-gray-500 dark:text-gray-400">· {s.localisation}</span>}
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{s.description}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(s.createdAt)}
                      {s.prenomAuteur && ` · ${s.prenomAuteur}`}
                      {s.contact && ` · ${s.contact}`}
                    </p>
                  </div>
                  <SignalementStatus id={s.id} statut={s.statut} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
