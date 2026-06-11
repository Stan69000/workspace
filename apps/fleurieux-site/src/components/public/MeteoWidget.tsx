import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { getMeteo, wmo, FLEURIEUX } from '@/lib/meteo'
import { getSaintDuJour } from '@/lib/saint'
import { Horloge } from './Horloge'

// Widget météo compact affiché sur l'accueil. Cliquable → page /meteo détaillée.
export async function MeteoWidget() {
  const [meteo, saint] = await Promise.all([getMeteo(), getSaintDuJour()])
  if (!meteo) return null

  const c = meteo.current
  const w = wmo(c.code, c.jour)
  const fete = saint?.saints[0] ?? (saint?.prenoms.length ? `Bonne fête ${saint.prenoms[0]}` : null)

  return (
    <Link
      href="/meteo"
      aria-label={`Météo à ${FLEURIEUX.court} : ${Math.round(c.temperature)} degrés, ${w.label.toLowerCase()}. Voir le détail.`}
      className="block rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-village-600"
    >
      <Card hover className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">{w.emoji}</span>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(c.temperature)}°C</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{FLEURIEUX.court} · {w.label}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-0.5 text-right sm:ml-auto">
          <Horloge withSeconds={false} className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100" />
          {fete && <p className="text-sm text-gray-500 dark:text-gray-400">{fete}</p>}
        </div>

        <span className="ml-auto whitespace-nowrap text-sm font-medium text-village-600 dark:text-village-400 sm:ml-0">
          Détails <span aria-hidden="true">→</span>
        </span>
      </Card>
    </Link>
  )
}
