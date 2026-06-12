// Génère les tables théoriques de passages bus à partir du GTFS TCL/SYTRAL :
//   - src/data/fleurieux-bus.json   : lignes 216 / 218 aux arrêts de Fleurieux
//   - src/data/correspondance-bus.json : ligne 86 (vers Gorge-de-Loup) à Tassin,
//     en correspondance (le 86 ne dessert pas Fleurieux).
//
// Pourquoi : le flux temps réel SIRI-Lite référence les arrêts par un id interne
// « ActIV » absent du GTFS, et les services SIRI stop-monitoring / discovery sont
// désactivés. On identifie donc les passages en matchant l'horaire visé (AimedTime)
// du temps réel à ces tables théoriques (clé route_id | HH:MM | direction).
//
// Usage :
//   GTFS_DIR=/chemin/gtfs_extrait node scripts/generate-bus-schedule.mjs
//   GRANDLYON_USER=… GRANDLYON_PASS=… node scripts/generate-bus-schedule.mjs
//
// À relancer quand la période de validité du GTFS change (cf. feed_info.txt).

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import { execFileSync } from 'node:child_process'

const GTFS_URL = 'https://download.data.grandlyon.com/files/rdata/tcl_sytral.tcltheorique/GTFS_TCL.ZIP'

// Libellés de destination « propres » à partir du trip_headsign GTFS.
const DEST_OVERRIDE = {
  'Gorge de Loup': 'Lyon Gorge-de-Loup',
  'Tour Salvagny Chambettes': 'La Tour-de-Salvagny',
  'Tarare Gare': 'Tarare',
  'VILLEFRANCHE/S - GARE ROUTIERE': 'Villefranche-sur-Saône',
  "L'ARBRESLE - GARE": "L'Arbresle",
}

// Cibles à générer : arrêts retenus + lignes + direction éventuellement filtrée.
const TARGETS = [
  { out: 'fleurieux-bus.json', stop: /fleurieux/i, routes: ['2080', '5003'], corr: false, dir: null },
  // Ligne 86 vers Gorge-de-Loup (dir 1) au terminus La Tour-de-Salvagny (Chambettes).
  { out: 'correspondance-bus.json', stop: /^Tour Salvagny Chambettes$/i, routes: ['86'], corr: true, dir: '1' },
]

function titleCase(s) {
  return s.replace(/\b(\p{L})(\p{L}*)/gu, (_, a, b) => a.toUpperCase() + b.toLowerCase())
}

function cleanStop(raw) {
  let s = raw.replace(/^Fleurieux(-sur-l'Arbresle)?\s*-?\s*/i, '').trim()
  s = s.replace(/\bRte\b/gi, 'Route').replace(/\bCrx\b/gi, 'Croix').replace(/\bZi\b/gi, 'ZI')
  s = s.replace(/Napoleon/gi, 'Napoléon').replace(/Montepy/gi, 'Montépy')
  s = s.replace(/Sainte? Agathe/gi, 'Sainte-Agathe').replace(/Saint Verand/gi, 'Saint-Vérand')
  s = s.replace(/\b(\p{L})(\p{L}*)/gu, (_, a, b) => a.toUpperCase() + b).replace(/\bDe\b/g, 'de').replace(/\bDu\b/g, 'du')
  return s || raw
}

function destLabel(headsign) {
  return DEST_OVERRIDE[headsign] ?? titleCase(headsign)
}

async function resolveGtfsDir() {
  if (process.env.GTFS_DIR) return process.env.GTFS_DIR
  const { GRANDLYON_USER, GRANDLYON_PASS } = process.env
  if (!GRANDLYON_USER || !GRANDLYON_PASS) {
    throw new Error('Définir GTFS_DIR, ou GRANDLYON_USER + GRANDLYON_PASS pour télécharger le GTFS.')
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtfs-tcl-'))
  const zip = path.join(dir, 'gtfs.zip')
  const auth = Buffer.from(`${GRANDLYON_USER}:${GRANDLYON_PASS}`).toString('base64')
  const res = await fetch(GTFS_URL, { headers: { Authorization: `Basic ${auth}` } })
  if (!res.ok) throw new Error(`Téléchargement GTFS échoué : HTTP ${res.status}`)
  fs.writeFileSync(zip, Buffer.from(await res.arrayBuffer()))
  // execFileSync (pas de shell → pas d'injection) ; chemins maîtrisés (tmpdir).
  execFileSync('unzip', ['-o', '-q', zip, '-d', dir])
  return dir
}

function readCsv(dir, file) {
  return fs.readFileSync(path.join(dir, file), 'utf8').split(/\r?\n/)
}

async function main() {
  const G = await resolveGtfsDir()

  // route_id -> short_name
  const shortName = {}
  for (const l of readCsv(G, 'routes.txt').slice(1)) {
    if (!l) continue
    const c = l.split(',')
    shortName[c[0]] = c[2]
  }

  // Arrêts physiques (location_type 0) : id -> nom
  const stopName = new Map()
  for (const l of readCsv(G, 'stops.txt').slice(1)) {
    if (!l) continue
    const c = l.split(',')
    if (c[6] === '0') stopName.set(c[0], (c[2] || '').replace(/\s+/g, ' ').trim())
  }

  const allRoutes = new Set(TARGETS.flatMap(t => t.routes))
  // trip_id -> { route, dir, headsign }
  const tripInfo = new Map()
  for (const l of readCsv(G, 'trips.txt').slice(1)) {
    if (!l) continue
    const c = l.split(',')
    if (allRoutes.has(c[0])) tripInfo.set(c[2], { route: c[0], dir: c[5], head: (c[3] || '').replace(/^"|"$/g, '') })
  }

  // Pré-filtre des arrêts par cible
  const stopMatch = (id, re) => { const n = stopName.get(id); return n && re.test(n) }

  // Accumulateurs par cible : key route|hhmm|dir -> entry
  const maps = TARGETS.map(() => new Map())

  await new Promise((resolve) => {
    const rl = readline.createInterface({ input: fs.createReadStream(path.join(G, 'stop_times.txt')) })
    let first = true
    rl.on('line', (l) => {
      if (first) { first = false; return }
      const c = l.split(',')
      const t = tripInfo.get(c[0])
      if (!t) return
      const stopId = c[3]
      const hhmm = (c[2] || '').slice(0, 5)
      TARGETS.forEach((tg, i) => {
        if (!tg.routes.includes(t.route)) return
        if (tg.dir && t.dir !== tg.dir) return
        if (!stopMatch(stopId, tg.stop)) return
        const key = `${t.route}|${hhmm}|${t.dir}`
        if (maps[i].has(key)) return
        maps[i].set(key, {
          line: shortName[t.route],
          route_id: t.route,
          aimed: hhmm,
          dir: t.dir,
          destination: destLabel(t.head),
          stop: cleanStop(stopName.get(stopId)),
          corr: tg.corr,
        })
      })
    })
    rl.on('close', resolve)
  })

  const feed = readCsv(G, 'feed_info.txt')[1]?.split(',') || []
  TARGETS.forEach((tg, i) => {
    const arr = [...maps[i].values()].sort((a, b) => a.line.localeCompare(b.line, undefined, { numeric: true }) || a.aimed.localeCompare(b.aimed))
    const out = path.join(process.cwd(), 'src/data', tg.out)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    const meta = { generatedFrom: 'GTFS TCL/SYTRAL', feedStart: feed[3] || '', feedEnd: feed[4] || '', count: arr.length }
    fs.writeFileSync(out, JSON.stringify({ meta, entries: arr }, null, 2))
    console.log(`écrit src/data/${tg.out} — ${arr.length} passages (validité GTFS ${meta.feedStart}→${meta.feedEnd})`)
  })
}

main().catch((e) => { console.error(e.message); process.exit(1) })
