import type { BusDeparture } from '@/types'
import fleurieuxSchedule from '@/data/fleurieux-bus.json'
import correspSchedule from '@/data/correspondance-bus.json'

// Temps réel bus à Fleurieux (lignes 216 / 218) via SIRI-Lite SYTRAL.
//
// Les arrêts du flux temps réel sont référencés par un id interne « ActIV » absent
// du GTFS, et les services SIRI stop-monitoring / discovery sont désactivés. On
// identifie donc les passages à Fleurieux en matchant l'horaire visé (AimedTime)
// d'estimated-timetables à la table théorique générée depuis le GTFS
// (src/data/fleurieux-bus.json), clé = route_id | HH:MM | direction.

const SIRI_ET = 'https://data.grandlyon.com/siri-lite/2.0/estimated-timetables.json'

const LINE_COLORS: Record<string, string> = {
  '216': '#992358',
  '218': '#6E8997',
  '86': '#E5282B',
}

type ScheduleEntry = {
  line: string
  route_id: string
  aimed: string
  dir: string
  destination: string
  stop: string
  corr?: boolean
}

const ENTRIES: ScheduleEntry[] = [
  ...(fleurieuxSchedule as { entries: ScheduleEntry[] }).entries,
  ...(correspSchedule as { entries: ScheduleEntry[] }).entries,
]
const ROUTE_IDS = [...new Set(ENTRIES.map(e => e.route_id))]

// Index de matching : route_id | HH:MM | dir(0/1) → arrêt/destination théoriques.
const INDEX = new Map<string, ScheduleEntry>()
for (const e of ENTRIES) INDEX.set(`${e.route_id}|${e.aimed}|${e.dir}`, e)

function hhmm(iso: string): string {
  // Les timestamps SIRI sont en heure locale Paris (offset inclus) → HH:MM = chars 11-16.
  return iso.slice(11, 16)
}

function authHeader(): string | null {
  const user = process.env.GRANDLYON_USER
  const pass = process.env.GRANDLYON_PASS
  if (!user || !pass) return null
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
}

type SiriCall = {
  AimedDepartureTime?: string
  ExpectedDepartureTime?: string
  AimedArrivalTime?: string
  ExpectedArrivalTime?: string
  Cancellation?: boolean
}
type SiriJourney = {
  LineRef?: { value?: string }
  DirectionRef?: { value?: string }
  Cancellation?: boolean
  EstimatedCalls?: { EstimatedCall?: SiriCall[] }
}

function collectJourneys(node: unknown, acc: SiriJourney[]): SiriJourney[] {
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (Array.isArray(obj.EstimatedVehicleJourney)) acc.push(...(obj.EstimatedVehicleJourney as SiriJourney[]))
    for (const k in obj) collectJourneys(obj[k], acc)
  }
  return acc
}

async function fetchLine(routeId: string, auth: string): Promise<SiriJourney[]> {
  const url = `${SIRI_ET}?LineRef=${encodeURIComponent(`ActIV:Line::${routeId}:SYTRAL`)}`
  const res = await fetch(url, { headers: { Authorization: auth }, next: { revalidate: 30 } })
  if (!res.ok) throw new Error(`SIRI-Lite ${routeId} failed: ${res.status}`)
  return collectJourneys(await res.json(), [])
}

export async function getBusData(): Promise<{ buses: BusDeparture[]; available: boolean }> {
  const auth = authHeader()
  if (!auth) return { buses: [], available: false }

  const journeysByLine = await Promise.all(ROUTE_IDS.map(id => fetchLine(id, auth)))
  const now = Math.floor(Date.now() / 1000)
  const seen = new Set<string>()
  const buses: BusDeparture[] = []

  for (const journeys of journeysByLine) {
    for (const j of journeys) {
      const route = j.LineRef?.value?.match(/::(\d+):/)?.[1]
      if (!route) continue
      const dir = j.DirectionRef?.value === 'inbound' ? '1' : '0' // outbound→0, inbound→1
      const journeyCancelled = j.Cancellation === true

      for (const c of j.EstimatedCalls?.EstimatedCall ?? []) {
        const aimedIso = c.AimedDepartureTime ?? c.AimedArrivalTime
        if (!aimedIso) continue
        const entry = INDEX.get(`${route}|${hhmm(aimedIso)}|${dir}`)
        if (!entry) continue

        const expectedIso = c.ExpectedDepartureTime ?? c.ExpectedArrivalTime ?? aimedIso
        const departureTime = Math.floor(new Date(expectedIso).getTime() / 1000)
        const delayMin = Math.round((departureTime - Math.floor(new Date(aimedIso).getTime() / 1000)) / 60)
        const cancelled = journeyCancelled || c.Cancellation === true

        if (!cancelled && departureTime < now - 60) continue

        const dedup = `${entry.line}|${entry.destination}|${entry.stop}|${departureTime}`
        if (seen.has(dedup)) continue
        seen.add(dedup)

        buses.push({
          line: entry.line,
          lineColor: LINE_COLORS[entry.line] ?? '#555',
          destination: entry.destination,
          stop: entry.stop,
          departureTime,
          delayMin,
          cancelled,
          corr: entry.corr === true,
        })
      }
    }
  }

  buses.sort((a, b) => a.departureTime - b.departureTime)
  return { buses: buses.slice(0, 20), available: true }
}
