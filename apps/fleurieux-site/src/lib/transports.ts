import type { TrainDeparture, TrainAlert, TransportsData } from '@/types'

const GTFS_RT_TRIPS = 'https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-trip-updates'
const GTFS_RT_ALERTS = 'https://proxy.transport.data.gouv.fr/resource/sncf-gtfs-rt-service-alerts'

const ARBRESLE_ID = '87721431'

const STOP_NAMES: Record<string, string> = {
  '87721159': 'Lyon Saint-Paul',
  '87721605': 'Sain-Bel',
  '87726802': 'Roanne',
  '87721423': 'Lozanne',
  '87721472': 'Tarare',
  '87721431': "L'Arbresle",
  '87721266': 'Albigny-Neuville',
  '87722025': 'Lyon Perrache',
  '87721308': 'Pontcharra-sur-Turdine',
  '87721340': 'Anse',
  '87721381': 'Bully-La Martine',
  '87721399': 'Chessy-les-Mines',
  '87721415': 'Alix-Civrieux',
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
    const arbIdx = stops.findIndex((s: { stopId?: string | null }) => s.stopId?.includes(ARBRESLE_ID))
    if (arbIdx === -1) continue

    const arbStop = stops[arbIdx]
    const dep = arbStop.departure ?? arbStop.arrival
    if (!dep) continue

    const depTime = longToNumber(dep.time)
    if (depTime < now || depTime > windowEnd) continue

    const cancelled = tu.trip?.scheduleRelationship === 3 // CANCELED

    // Direction: last stop after L'Arbresle → vers Sain-Bel or Lyon
    const lastStop = stops[stops.length - 1]
    const lastStopId: string = lastStop?.stopId ?? ''
    const destName = stopName(lastStopId)
    const direction: TrainDeparture['direction'] = lastStopId.includes('87721159') || lastStopId.includes('87722025')
      ? 'vers_lyon'
      : 'vers_sain_bel'

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
        || e.routeId?.includes('2DF95135') // Lyon Saint-Paul ↔ Sain-Bel
        || e.routeId?.includes('45E281C7') // Lyon ↔ Roanne
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

  return { departures, alerts, fetchedAt: now }
}
