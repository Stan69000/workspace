// Génère src/data/fleurieux-bus.json : table théorique des passages bus à Fleurieux
// (lignes 216 / 218) à partir du GTFS TCL/SYTRAL.
//
// Pourquoi : le flux temps réel SIRI-Lite référence les arrêts par un id interne
// « ActIV » absent du GTFS, et les services SIRI stop-monitoring / discovery sont
// désactivés. On identifie donc les passages à Fleurieux en matchant l'horaire visé
// (AimedTime) du temps réel à cette table théorique (clé route_id | HH:MM | direction).
//
// Usage :
//   GTFS_DIR=/chemin/gtfs_extrait node scripts/generate-bus-schedule.mjs
//   # ou, pour télécharger le GTFS (nécessite un compte data.grandlyon) :
//   GRANDLYON_USER=… GRANDLYON_PASS=… node scripts/generate-bus-schedule.mjs
//
// À relancer quand la période de validité du GTFS change (cf. feed_info.txt).

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'
import { execFileSync } from 'node:child_process'

const GTFS_URL = 'https://download.data.grandlyon.com/files/rdata/tcl_sytral.tcltheorique/GTFS_TCL.ZIP'

// Périmètre : lignes desservant Fleurieux dont le temps réel est exploitable.
const ROUTES = {
  '2080': { line: '216', dest: { '0': 'Lyon Gorge-de-Loup', '1': 'Tarare' } },
  '5003': { line: '218', dest: { '0': 'Villefranche-sur-Saône', '1': "L'Arbresle" } },
}

function cleanStop(raw) {
  let s = raw.replace(/^Fleurieux(-sur-l'Arbresle)?\s*-?\s*/i, '').trim()
  s = s.replace(/\bRte\b/gi, 'Route').replace(/\bCrx\b/gi, 'Croix').replace(/\bZi\b/gi, 'ZI')
  s = s.replace(/Napoleon/gi, 'Napoléon').replace(/Montepy/gi, 'Montépy')
  s = s.replace(/Sainte? Agathe/gi, 'Sainte-Agathe').replace(/Saint Verand/gi, 'Saint-Vérand')
  // Title-case léger en conservant les particules
  return s.replace(/\b(\p{L})(\p{L}*)/gu, (_, a, b) => a.toUpperCase() + b).replace(/\bDe\b/g, 'de').replace(/\bDu\b/g, 'du') || raw
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

async function main() {
  const G = await resolveGtfsDir()
  const read = (f) => fs.readFileSync(path.join(G, f), 'utf8').split(/\r?\n/)

  // Arrêts physiques de Fleurieux (location_type 0)
  const fleu = new Map()
  for (const l of read('stops.txt').slice(1)) {
    if (!l) continue
    const c = l.split(',')
    if (/fleurieux/i.test(c[2] || '') && c[6] === '0') fleu.set(c[0], cleanStop(c[2].replace(/\s+/g, ' ').trim()))
  }

  // Trajets des lignes ciblées → direction
  const tripDir = new Map()
  for (const l of read('trips.txt').slice(1)) {
    if (!l) continue
    const c = l.split(',')
    if (ROUTES[c[0]]) tripDir.set(c[2], { route: c[0], dir: c[5] })
  }

  // Horaires de passage à Fleurieux
  const map = new Map()
  await new Promise((resolve) => {
    const rl = readline.createInterface({ input: fs.createReadStream(path.join(G, 'stop_times.txt')) })
    let first = true
    rl.on('line', (l) => {
      if (first) { first = false; return }
      const c = l.split(',')
      const t = tripDir.get(c[0])
      if (t && fleu.has(c[3])) {
        const hhmm = (c[2] || '').slice(0, 5)
        const key = `${t.route}|${hhmm}|${t.dir}`
        if (!map.has(key)) {
          map.set(key, {
            line: ROUTES[t.route].line,
            route_id: t.route,
            aimed: hhmm,
            dir: t.dir,
            destination: ROUTES[t.route].dest[t.dir] ?? '',
            stop: fleu.get(c[3]),
          })
        }
      }
    })
    rl.on('close', resolve)
  })

  const arr = [...map.values()].sort((a, b) => a.line.localeCompare(b.line) || a.aimed.localeCompare(b.aimed))
  const out = path.join(process.cwd(), 'src/data/fleurieux-bus.json')
  fs.mkdirSync(path.dirname(out), { recursive: true })
  const feed = read('feed_info.txt')[1]?.split(',') || []
  const meta = { generatedFrom: 'GTFS TCL/SYTRAL', feedStart: feed[3] || '', feedEnd: feed[4] || '', count: arr.length }
  fs.writeFileSync(out, JSON.stringify({ meta, entries: arr }, null, 2))
  console.log(`écrit ${out} — ${arr.length} passages (validité GTFS ${meta.feedStart}→${meta.feedEnd})`)
}

main().catch((e) => { console.error(e.message); process.exit(1) })
