import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { NouvelleAnnonce } from '@/components/public/NouvelleAnnonce'
import { moduleActif } from '@/lib/modules'
import { formatDateRelative } from '@/lib/utils'

export const metadata: Metadata = { title: 'Petites annonces' }
export const dynamic = 'force-dynamic'

const CAT_LABEL: Record<string, string> = {
  DON: 'Don', RECHERCHE: 'Recherche', COVOITURAGE: 'Covoiturage',
  SERVICE: 'Service', PRET: 'Prêt', EMPLOI: 'Emploi', AUTRE: 'Autre',
}

export default async function AnnoncesPage() {
  if (!(await moduleActif('annonces'))) notFound()

  const now = new Date()
  const annonces = await prisma.annonce.findMany({
    where: { statut: 'PUBLIE', OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
    orderBy: { createdAt: 'desc' },
    take: 60,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Petites annonces</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Entre voisins : dons, covoiturage, prêt de matériel, coups de main…
        </p>
      </div>

      <section aria-labelledby="liste-titre">
        <h2 id="liste-titre" className="sr-only">Annonces publiées</h2>
        {annonces.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">Aucune annonce pour le moment. Soyez le premier à en publier une !</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {annonces.map(a => (
              <li key={a.id}>
                <Card className="h-full">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{a.titre}</h3>
                    <Badge variant="blue">{CAT_LABEL[a.categorie] ?? 'Autre'}</Badge>
                  </div>
                  <p className="mt-1 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">{a.description}</p>
                  <p className="mt-3 text-xs text-gray-400">
                    {a.prenomAuteur} · {formatDateRelative(a.createdAt)} · <span className="text-village-600 dark:text-village-400">{a.contact}</span>
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="form-titre" className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
        <h2 id="form-titre" className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Déposer une annonce</h2>
        <NouvelleAnnonce />
      </section>
    </div>
  )
}
