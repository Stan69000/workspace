import type { TrainDeparture, TrainAlert, TransportsData } from '@/types'
import { getBusData } from '@/lib/bus'

const GTFS_RT_TRIPS = 'https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-trip-updates'
const GTFS_RT_ALERTS = 'https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-service-alerts'

// Gare suivie : Fleurieux-sur-l'Arbresle (halte tram-train ligne 22 uniquement,
// pas desservie par les TER Lyon–Roanne/Tarare qui ne s'arrêtent qu'à L'Arbresle).
const FLEURIEUX_ID = '87721563'

// Côté Sain-Bel au-delà de Fleurieux : sert à déterminer le sens de circulation.
const SAIN_BEL_SIDE = ['87721431', '87721605'] // L'Arbresle, Sain-Bel

const STOP_NAMES: Record<string, string> = {
  '87721159': 'Lyon Saint-Paul',
  '87721563': "Fleurieux-sur-l'Arbresle",
  '87721431': "L'Arbresle",
  '87721605': 'Sain-Bel',
}

function stopName(stopId: string): string {
  const match = Object.keys(STOP_NAMES).find(k => stopId.includes(k))
  return match ? STOP_NAMES[match] : stopId
}

function longToNumber(v: unknown): number {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && 'low' in v) return (v as { low: number }).low
  return 0
}

async function fetchProto(url: string): Promise<Uint8Array> {
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`GTFS-RT fetch failed: ${res.status}`)
  const buf = await res.arrayBuffer()
  return new Uint8Array(buf)
}

export async function getTransportsData(): Promise<TransportsData> {
  const GtfsRt = (await import('gtfs-realtime-bindings')).transit_realtime

  const [tripsBuf, alertsBuf] = await Promise.all([
    fetchProto(GTFS_RT_TRIPS),
    fetchProto(GTFS_RT_ALERTS),
  ])

  const tripsFeed = GtfsRt.FeedMessage.decode(tripsBuf)
  const alertsFeed = GtfsRt.FeedMessage.decode(alertsBuf)

  const now = Math.floor(Date.now() / 1000)
  const windowEnd = now + 3 * 3600 // next 3 hours

  const departures: TrainDeparture[] = []

  for (const entity of tripsFeed.entity) {
    const tu = entity.tripUpdate
    if (!tu) continue

    const stops = tu.stopTimeUpdate ?? []
    const fleuIdx = stops.findIndex((s: { stopId?: string | null }) => s.stopId?.includes(FLEURIEUX_ID))
    if (fleuIdx === -1) continue

    const fleuStop = stops[fleuIdx]
    const dep = fleuStop.departure ?? fleuStop.arrival
    if (!dep) continue

    const depTime = longToNumber(dep.time)
    if (depTime < now || depTime > windowEnd) continue

    const cancelled = tu.trip?.scheduleRelationship === 3 // CANCELED

    // Sens : si un arrêt après Fleurieux est côté Sain-Bel (L'Arbresle/Sain-Bel),
    // le train s'en va vers Sain-Bel ; sinon il remonte vers Lyon.
    const afterFleurieux = stops.slice(fleuIdx + 1).map((s: { stopId?: string | null }) => s.stopId ?? '')
    const direction: TrainDeparture['direction'] = afterFleurieux.some(
      id => SAIN_BEL_SIDE.some(s => id.includes(s))
    )
      ? 'vers_sain_bel'
      : 'vers_lyon'

    const destName = stopName(stops[stops.length - 1]?.stopId ?? '')

    departures.push({
      tripId: entity.id,
      direction,
      destination: destName,
      departureTime: depTime,
      delaySeconds: longToNumber(dep.delay),
      cancelled,
    })
  }

  departures.sort((a, b) => a.departureTime - b.departureTime)

  const alerts: TrainAlert[] = []

  for (const entity of alertsFeed.entity) {
    const alert = entity.alert
    if (!alert) continue

    // Keep only alerts that mention our line stops
    const informedEntities: { stopId?: string | null; routeId?: string | null }[] = alert.informedEntity ?? []
    const relevant = informedEntities.some(
      e => Object.keys(STOP_NAMES).some(k => e.stopId?.includes(k))
        || e.routeId?.includes('2DF95135') // Lyon Saint-Paul ↔ Sain-Bel (ligne 22)
    )
    if (!relevant) continue

    const header = (alert.headerText?.translation?.[0]?.text ?? '').trim()
    const description = (alert.descriptionText?.translation?.[0]?.text ?? '').trim()

    alerts.push({
      id: entity.id,
      headerText: header,
      descriptionText: description,
      cause: String(alert.cause ?? ''),
      effect: String(alert.effect ?? ''),
      activePeriods: (alert.activePeriod ?? []).map((p: { start?: unknown; end?: unknown }) => ({
        start: longToNumber(p.start),
        end: p.end ? longToNumber(p.end) : null,
      })),
    })
  }

  // Bus temps réel (échec isolé : ne casse jamais l'affichage des trains)
  const { buses, available: busAvailable } = await getBusData().catch(() => ({ buses: [], available: false }))

  return { departures, alerts, buses, busAvailable, fetchedAt: now }
}
