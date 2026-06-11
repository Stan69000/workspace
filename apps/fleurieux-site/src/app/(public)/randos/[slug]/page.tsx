import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Badge } from '@/components/ui/Badge'
import { RandoChartClient as RandoChart } from '@/components/public/RandoChartClient'
import { RandoTraceMapClient } from '@/components/public/RandoTraceMapClient'

interface Props { params: Promise<{ slug: string }> }

const DIFFICULTE_COLOR: Record<string, 'green' | 'yellow' | 'red'> = {
  FACILE: 'green', INTERMEDIAIRE: 'yellow', DIFFICILE: 'red',
}
const DIFFICULTE_LABEL: Record<string, string> = {
  FACILE: 'Facile', INTERMEDIAIRE: 'Intermédiaire', DIFFICILE: 'Difficile',
}
const TYPE_LABEL: Record<string, string> = {
  BOUCLE: 'Boucle', ALLER_RETOUR: 'Aller-retour', LINEAIRE: 'Linéaire',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const rando = await prisma.rando.findUnique({ where: { slug }, select: { nom: true, description: true } })
  if (!rando) return {}
  return { title: rando.nom, description: rando.description ?? undefined }
}

export default async function RandoPage({ params }: Props) {
  const { slug } = await params
  const rando = await prisma.rando.findUnique({
    where: { slug, statut: 'PUBLIE' },
    include: { pointsInteret: { orderBy: { ordre: 'asc' } }, photos: { orderBy: { ordre: 'asc' } } },
  })
  if (!rando) notFound()

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={DIFFICULTE_COLOR[rando.difficulte]}>{DIFFICULTE_LABEL[rando.difficulte]}</Badge>
          <Badge variant="gray">{TYPE_LABEL[rando.typeCircuit]}</Badge>
        </div>
        <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">🥾 {rando.nom}</h1>
        {rando.description && <p className="mt-2 text-gray-600 dark:text-gray-400">{rando.description}</p>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Distance', value: rando.distanceKm ? `${rando.distanceKm} km` : '—' },
          { label: 'Durée', value: rando.dureeMinutes ? `${Math.floor(rando.dureeMinutes / 60)}h${rando.dureeMinutes % 60 > 0 ? (rando.dureeMinutes % 60).toString().padStart(2, '0') : ''}` : '—' },
          { label: 'Dénivelé', value: rando.deniveleM ? `+${rando.deniveleM} m` : '—' },
          { label: 'Départ', value: rando.depart ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-gray-200 p-4 text-center dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{value}</p>
          </div>
        ))}
      </div>

      {/* Tracé du parcours (carte interactive) */}
      {rando.traceGeojson && (
        <div className="space-y-1">
          <RandoTraceMapClient geojson={rando.traceGeojson} />
          <p className="text-xs text-gray-400">Tracé : © les contributeurs OpenStreetMap</p>
        </div>
      )}

      {/* Carte & tracé (source externe) */}
      {rando.sourceUrl && (
        <a
          href={rando.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-4 rounded-xl border border-village-200 bg-village-50/50 p-4 transition-colors hover:bg-village-50 dark:border-village-900 dark:bg-village-900/10 dark:hover:bg-village-900/20"
        >
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">Carte, tracé GPS et profil du parcours</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Source : {rando.sourceNom}
              {rando.noteSource ? ` · ${rando.noteSource.toFixed(1)}/5` : ''}
              <span className="sr-only"> (ouvre dans un nouvel onglet)</span>
            </p>
          </div>
          <span aria-hidden="true" className="shrink-0 font-medium text-village-600 dark:text-village-400">Voir →</span>
        </a>
      )}

      {/* Profil altimétrique estimé — seulement sans source réelle */}
      {!rando.sourceUrl && rando.distanceKm && rando.deniveleM && (
        <RandoChart distanceKm={rando.distanceKm} deniveleM={rando.deniveleM} />
      )}

      {/* Points d'intérêt */}
      {rando.pointsInteret.length > 0 && (
        <div>
          <h2 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">Points d&apos;intérêt</h2>
          <ol className="space-y-2">
            {rando.pointsInteret.map((pt, i) => (
              <li key={pt.id} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-village-100 text-xs font-semibold text-village-700 dark:bg-village-900/30 dark:text-village-400">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{pt.nom}</p>
                  {pt.description && <p className="text-sm text-gray-500 dark:text-gray-400">{pt.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Télécharger GPX */}
      {rando.gpxUrl && (
        <a
          href={rando.gpxUrl}
          download
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ⬇️ Télécharger le tracé GPX
        </a>
      )}
    </div>
  )
}
