import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { AnnonceActions } from '@/components/admin/AdminActions'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = { title: 'Annonces — Admin' }
export const dynamic = 'force-dynamic'

const CAT: Record<string, string> = {
  DON: 'Don', RECHERCHE: 'Recherche', COVOITURAGE: 'Covoiturage',
  SERVICE: 'Service', PRET: 'Prêt', EMPLOI: 'Emploi', AUTRE: 'Autre',
}

function Ligne({ a }: { a: { id: string; titre: string; description: string; categorie: string; prenomAuteur: string; contact: string; statut: string; createdAt: Date } }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="blue">{CAT[a.categorie] ?? 'Autre'}</Badge>
            <span className="font-medium text-gray-900 dark:text-gray-100">{a.titre}</span>
          </div>
          <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">{a.description}</p>
          <p className="mt-1 text-xs text-gray-400">{a.prenomAuteur} · {a.contact} · {formatDate(a.createdAt)}</p>
        </div>
        <AnnonceActions id={a.id} statut={a.statut} />
      </div>
    </Card>
  )
}

export default async function AdminAnnoncesPage() {
  const [enAttente, publiees] = await Promise.all([
    prisma.annonce.findMany({ where: { statut: 'EN_ATTENTE' }, orderBy: { createdAt: 'desc' } }),
    prisma.annonce.findMany({ where: { statut: 'PUBLIE' }, orderBy: { createdAt: 'desc' }, take: 60 }),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Petites annonces</h1>

      <section>
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
          À modérer {enAttente.length > 0 && <span className="text-red-600">({enAttente.length})</span>}
        </h2>
        {enAttente.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Rien à modérer.</p>
        ) : (
          <ul className="space-y-2">{enAttente.map(a => <li key={a.id}><Ligne a={a} /></li>)}</ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Publiées ({publiees.length})</h2>
        {publiees.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune annonce publiée.</p>
        ) : (
          <ul className="space-y-2">{publiees.map(a => <li key={a.id}><Ligne a={a} /></li>)}</ul>
        )}
      </section>
    </div>
  )
}
