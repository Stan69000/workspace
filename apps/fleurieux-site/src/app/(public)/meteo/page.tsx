import type { Metadata } from 'next'
import { Card } from '@/components/ui/Card'
import { Horloge } from '@/components/public/Horloge'
import { MeteoChartClient } from '@/components/public/MeteoChartClient'
import {
  getMeteo, wmo, ventCardinal, uvLabel, meteoGradient, FLEURIEUX,
} from '@/lib/meteo'
import { getSaintDuJour } from '@/lib/saint'
import { parisDateLabel } from '@/lib/paris'

export const revalidate = 1800 // 30 min

export const metadata: Metadata = {
  title: 'Météo · Fleurieux-sur-l’Arbresle',
  description: 'Météo locale détaillée de Fleurieux-sur-l’Arbresle : conditions actuelles, prévisions horaires et sur 7 jours, lever et coucher du soleil, heure de Paris et saint du jour.',
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {value}{sub && <span className="ml-1 text-sm font-normal text-gray-500 dark:text-gray-400">{sub}</span>}
      </dd>
    </div>
  )
}

export default async function MeteoPage() {
  const [meteo, saint] = await Promise.all([getMeteo(), getSaintDuJour()])

  if (!meteo) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Météo</h1>
        <Card>
          <p className="text-gray-600 dark:text-gray-400">
            Données météo momentanément indisponibles. Réessayez dans quelques minutes.
          </p>
        </Card>
      </div>
    )
  }

  const c = meteo.current
  const w = wmo(c.code, c.jour)
  const auj = meteo.jours[0]
  const fete = saint?.saints.length ? saint.saints.join(', ') : null

  return (
    <div className="space-y-8">
      {/* Conditions actuelles */}
      <section aria-labelledby="meteo-titre">
        <div className={`rounded-2xl bg-gradient-to-br ${meteoGradient(c.code, c.jour)} px-6 py-8 text-white sm:px-8`}>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <span className="text-6xl sm:text-7xl" aria-hidden="true">{w.emoji}</span>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-white/80">{FLEURIEUX.nom}</p>
                <h1 id="meteo-titre" className="mt-1 text-5xl font-bold leading-none">
                  {Math.round(c.temperature)}°C
                </h1>
                <p className="mt-2 text-lg text-white/90">{w.label}</p>
                <p className="text-sm text-white/75">Ressenti {Math.round(c.ressenti)}°C</p>
              </div>
            </div>

            <div className="text-right">
              <Horloge className="block text-4xl font-bold tabular-nums" />
              <p className="mt-1 text-sm capitalize text-white/85">{parisDateLabel()}</p>
              {fete && (
                <p className="mt-3 text-sm text-white/90">
                  <span aria-hidden="true">✝ </span>{fete}
                </p>
              )}
              {!fete && saint?.prenoms.length ? (
                <p className="mt-3 text-sm text-white/90">Bonne fête aux {saint.prenoms.join(', ')}</p>
              ) : null}
            </div>
          </div>

          {saint?.prenoms.length && fete ? (
            <p className="mt-4 border-t border-white/20 pt-3 text-sm text-white/80">
              Bonne fête aux {saint.prenoms.join(', ')}
            </p>
          ) : null}
        </div>
      </section>

      {/* Détails du jour */}
      <section aria-labelledby="details-titre">
        <h2 id="details-titre" className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Détails</h2>
        <Card>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Humidité" value={`${c.humidite}%`} />
            <Stat label="Vent" value={`${Math.round(c.vent)}`} sub={`km/h ${ventCardinal(c.ventDirection)}`} />
            <Stat label="Précip." value={`${c.precipitation}`} sub="mm" />
            <Stat label="UV max" value={`${auj.uv}`} sub={uvLabel(auj.uv)} />
            <Stat label="Lever" value={auj.lever} sub="🌅" />
            <Stat label="Coucher" value={auj.coucher} sub="🌇" />
          </dl>
        </Card>
      </section>

      {/* Prévisions horaires */}
      <section aria-labelledby="heures-titre">
        <h2 id="heures-titre" className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Prochaines 24 heures</h2>
        <Card className="space-y-4">
          <div className="h-[220px]">
            <MeteoChartClient heures={meteo.heures} />
          </div>
          <ul className="flex gap-3 overflow-x-auto pb-1">
            {meteo.heures.map(h => {
              const hw = wmo(h.code)
              return (
                <li key={h.time} className="flex min-w-[3.5rem] flex-col items-center gap-1 text-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{h.time.slice(11, 13)}h</span>
                  <span className="text-xl" aria-hidden="true">{hw.emoji}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{h.temp}°</span>
                  <span className="text-xs text-blue-500 dark:text-blue-400">{h.precip}%</span>
                </li>
              )
            })}
          </ul>
        </Card>
      </section>

      {/* Prévisions 7 jours */}
      <section aria-labelledby="jours-titre">
        <h2 id="jours-titre" className="mb-4 text-xl font-bold text-gray-900 dark:text-gray-100">Prévisions sur 7 jours</h2>
        <Card>
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {meteo.jours.map((j, i) => {
              const jw = wmo(j.code)
              const nom = i === 0 ? "Aujourd'hui" : new Date(j.date).toLocaleDateString('fr-FR', { weekday: 'long' })
              return (
                <li key={j.date} className="flex items-center gap-4 py-2.5">
                  <span className="w-28 shrink-0 capitalize text-gray-700 dark:text-gray-300">{nom}</span>
                  <span className="text-2xl" aria-hidden="true">{jw.emoji}</span>
                  <span className="hidden flex-1 text-sm text-gray-500 dark:text-gray-400 sm:block">{jw.label}</span>
                  <span className="ml-auto text-sm text-blue-500 dark:text-blue-400" title="Probabilité de précipitations">
                    💧 {j.precipProb}%
                  </span>
                  <span className="w-20 text-right tabular-nums">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{j.max}°</span>{' '}
                    <span className="text-gray-400">{j.min}°</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      </section>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Données météo : <a href="https://open-meteo.com" className="underline hover:text-gray-600 dark:hover:text-gray-300" rel="noopener noreferrer" target="_blank">Open-Meteo</a>
        {' / '}<a href="https://wttr.in" className="underline hover:text-gray-600 dark:hover:text-gray-300" rel="noopener noreferrer" target="_blank">wttr.in</a>
        {' · '}Saint du jour : <a href="https://nominis.cef.fr" className="underline hover:text-gray-600 dark:hover:text-gray-300" rel="noopener noreferrer" target="_blank">Nominis (CEF)</a>
        {' · '}Mise à jour toutes les 30 min.
      </p>
    </div>
  )
}
