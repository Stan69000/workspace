'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TransportsData, TrainDeparture, TrainAlert, BusDeparture } from '@/types'

const REFRESH_MS = 2 * 60 * 1000

// Lignes disposant d'un pictogramme officiel TCL self-hosté (public/lignes/<n>.svg).
const PICTO_LINES = new Set(['86', '216', '218'])

function formatTime(ts: number, delaySeconds: number): { scheduled: string; delayed: boolean; delayMin: number } {
  const d = new Date(ts * 1000)
  const scheduled = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })
  const delayMin = Math.round(delaySeconds / 60)
  return { scheduled, delayed: delayMin >= 1, delayMin }
}

function relativeTime(ts: number): string {
  const diff = ts - Math.floor(Date.now() / 1000)
  if (diff < 60) return 'maintenant'
  const min = Math.floor(diff / 60)
  if (min < 60) return `dans ${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `dans ${h}h${String(m).padStart(2, '0')}` : `dans ${h}h`
}

function DepartureRow({ dep }: { dep: TrainDeparture }) {
  const { scheduled, delayed, delayMin } = formatTime(dep.departureTime, dep.delaySeconds)

  return (
    <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
      dep.cancelled
        ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-lg" aria-hidden="true">
          {dep.direction === 'vers_lyon' ? '🚂' : '🚃'}
        </span>
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {dep.destination}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {dep.direction === 'vers_lyon' ? 'Vers Lyon' : 'Vers Sain-Bel'}
          </div>
        </div>
      </div>

      <div className="text-right">
        {dep.cancelled ? (
          <span className="font-semibold text-red-600 dark:text-red-400">Supprimé</span>
        ) : (
          <>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {scheduled}
              {delayed && (
                <span className="ml-1 text-sm font-normal text-orange-600 dark:text-orange-400">
                  +{delayMin} min
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {relativeTime(dep.departureTime)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function BusRow({ bus }: { bus: BusDeparture }) {
  const time = new Date(bus.departureTime * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })

  return (
    <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
      bus.cancelled
        ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
        : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
    }`}>
      <div className="flex items-center gap-3">
        {PICTO_LINES.has(bus.line) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/lignes/${bus.line}.svg`} alt={`Ligne ${bus.line}`} className="h-7 w-auto shrink-0" />
        ) : (
          <span
            className="inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded px-1.5 text-sm font-bold text-white"
            style={{ backgroundColor: bus.lineColor }}
          >
            {bus.line}
          </span>
        )}
        <div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{bus.destination}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Arrêt {bus.stop}</div>
        </div>
      </div>

      <div className="text-right">
        {bus.cancelled ? (
          <span className="font-semibold text-red-600 dark:text-red-400">Supprimé</span>
        ) : (
          <>
            <div className="font-semibold text-gray-900 dark:text-gray-100">
              {time}
              {bus.delayMin >= 1 && (
                <span className="ml-1 text-sm font-normal text-orange-600 dark:text-orange-400">
                  +{bus.delayMin} min
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{relativeTime(bus.departureTime)}</div>
          </>
        )}
      </div>
    </div>
  )
}

function AlertBanner({ alert }: { alert: TrainAlert }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border border-orange-300 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-start justify-between gap-2 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true">⚠️</span>
          <span className="font-medium text-orange-900 dark:text-orange-200">
            {alert.headerText || 'Perturbation sur la ligne'}
          </span>
        </div>
        <span className="mt-0.5 shrink-0 text-orange-700 dark:text-orange-400" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && alert.descriptionText && (
        <p className="mt-2 whitespace-pre-line text-sm text-orange-800 dark:text-orange-300">
          {alert.descriptionText}
        </p>
      )}
    </div>
  )
}

export function TransportsPage({ initial }: { initial: TransportsData | null }) {
  const [data, setData] = useState<TransportsData | null>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initial ? null : 'Données indisponibles')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/transports')
      if (!res.ok) throw new Error('Erreur serveur')
      const json: TransportsData = await res.json()
      setData(json)
      setError(null)
    } catch {
      setError('Impossible de charger les données transport')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = setInterval(refresh, REFRESH_MS)
    return () => clearInterval(id)
  }, [refresh])

  const toLyon = data?.departures.filter(d => d.direction === 'vers_lyon') ?? []
  const toSainBel = data?.departures.filter(d => d.direction === 'vers_sain_bel') ?? []
  const buses = data?.buses ?? []
  const fleurieuxBuses = buses.filter(b => !b.corr)
  const corrBuses = buses.filter(b => b.corr)

  return (
    <div className="space-y-6">
      {data?.alerts.map(a => <AlertBanner key={a.id} alert={a} />)}

      {error && !data && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <span aria-hidden="true">🚂</span> Vers Lyon Saint-Paul
          </h2>
          {toLyon.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun départ dans les 3 prochaines heures</p>
          ) : (
            <div className="space-y-2">
              {toLyon.map(d => <DepartureRow key={d.tripId} dep={d} />)}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <span aria-hidden="true">🚃</span> Vers Sain-Bel
          </h2>
          {toSainBel.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun départ dans les 3 prochaines heures</p>
          ) : (
            <div className="space-y-2">
              {toSainBel.map(d => <DepartureRow key={d.tripId} dep={d} />)}
            </div>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <span aria-hidden="true">🚌</span> Bus à Fleurieux
          <span className="text-sm font-normal text-gray-400 dark:text-gray-500">temps réel</span>
        </h2>
        {!data?.busAvailable ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Flux bus temporairement indisponible</p>
        ) : (
          <>
            {fleurieuxBuses.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Aucun passage bus dans l&apos;immédiat</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {fleurieuxBuses.map((b, i) => <BusRow key={`${b.line}-${b.destination}-${b.departureTime}-${i}`} bus={b} />)}
              </div>
            )}
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
              Lignes 216 (Tarare ↔ Lyon Gorge-de-Loup) et 218 (L&apos;Arbresle ↔ Villefranche). Lignes scolaires non incluses.
            </p>

            {corrBuses.length > 0 && (
              <div className="mt-5">
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Correspondance vers Lyon — bus 86 à La Tour-de-Salvagny (Chambettes)
                </h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {corrBuses.slice(0, 6).map((b, i) => <BusRow key={`corr-${b.departureTime}-${i}`} bus={b} />)}
                </div>
                <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
                  Au terminus de La Tour-de-Salvagny (Chambettes), le bus 86 part vers Lyon Gorge-de-Loup (métro D). À noter : le tram-train dessert aussi Gorge-de-Loup directement.
                </p>
              </div>
            )}
          </>
        )}
      </section>

      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-600">
        <span>
          {data ? `Mis à jour à ${new Date(data.fetchedAt * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' })}` : ''}
        </span>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
        >
          {loading ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>
    </div>
  )
}
