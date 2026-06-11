// Météo locale via Open-Meteo (gratuit, sans clé). Fleurieux-sur-l'Arbresle ≈ 45.82, 4.66.

export const FLEURIEUX = { lat: 45.82, lon: 4.66, nom: 'Fleurieux-sur-l’Arbresle', court: 'Fleurieux' }

// Virgules littérales (et non %2C) pour rester strictement identique à l'API testée.
const URL = 'https://api.open-meteo.com/v1/forecast'
  + `?latitude=${FLEURIEUX.lat}&longitude=${FLEURIEUX.lon}`
  + '&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m'
  + '&hourly=temperature_2m,precipitation_probability,weather_code'
  + '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max'
  + '&timezone=Europe%2FParis&forecast_days=7'

// ── Codes WMO → libellé + emoji (variante nuit pour ciel dégagé / peu nuageux)
const WMO: Record<number, { label: string; emoji: string; nuit?: string }> = {
  0:  { label: 'Ciel dégagé',           emoji: '☀️', nuit: '🌙' },
  1:  { label: 'Plutôt dégagé',         emoji: '🌤️', nuit: '🌙' },
  2:  { label: 'Partiellement nuageux', emoji: '⛅', nuit: '☁️' },
  3:  { label: 'Couvert',               emoji: '☁️' },
  45: { label: 'Brouillard',            emoji: '🌫️' },
  48: { label: 'Brouillard givrant',    emoji: '🌫️' },
  51: { label: 'Bruine légère',         emoji: '🌦️' },
  53: { label: 'Bruine',                emoji: '🌦️' },
  55: { label: 'Bruine dense',          emoji: '🌧️' },
  56: { label: 'Bruine verglaçante',    emoji: '🌧️' },
  57: { label: 'Bruine verglaçante',    emoji: '🌧️' },
  61: { label: 'Pluie faible',          emoji: '🌦️' },
  63: { label: 'Pluie',                 emoji: '🌧️' },
  65: { label: 'Pluie forte',           emoji: '🌧️' },
  66: { label: 'Pluie verglaçante',     emoji: '🌧️' },
  67: { label: 'Pluie verglaçante',     emoji: '🌧️' },
  71: { label: 'Neige faible',          emoji: '🌨️' },
  73: { label: 'Neige',                 emoji: '🌨️' },
  75: { label: 'Neige forte',           emoji: '❄️' },
  77: { label: 'Grains de neige',       emoji: '🌨️' },
  80: { label: 'Averses',               emoji: '🌦️' },
  81: { label: 'Averses',               emoji: '🌧️' },
  82: { label: 'Averses violentes',     emoji: '⛈️' },
  85: { label: 'Averses de neige',      emoji: '🌨️' },
  86: { label: 'Averses de neige',      emoji: '❄️' },
  95: { label: 'Orage',                 emoji: '⛈️' },
  96: { label: 'Orage grêleux',         emoji: '⛈️' },
  99: { label: 'Orage de grêle',        emoji: '⛈️' },
}

export function wmo(code: number, jour = true): { label: string; emoji: string } {
  const w = WMO[code] ?? { label: 'Indéterminé', emoji: '🌡️' }
  return { label: w.label, emoji: !jour && w.nuit ? w.nuit : w.emoji }
}

// ── Direction du vent (degrés → rose des vents 8 secteurs)
const ROSE = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
export function ventCardinal(deg: number): string {
  return ROSE[Math.round(deg / 45) % 8]
}

// ── Indice UV → libellé
export function uvLabel(uv: number): string {
  if (uv < 3) return 'Faible'
  if (uv < 6) return 'Modéré'
  if (uv < 8) return 'Élevé'
  if (uv < 11) return 'Très élevé'
  return 'Extrême'
}

// ── Gradient d'ambiance (Tailwind) selon conditions
export function meteoGradient(code: number, jour: boolean): string {
  if (!jour) return 'from-indigo-900 to-slate-900'
  if (code <= 1) return 'from-sky-400 to-blue-600'
  if (code <= 3 || code === 45 || code === 48) return 'from-slate-400 to-slate-600'
  if (code >= 71 && code <= 86) return 'from-sky-300 to-slate-500'
  if (code >= 95) return 'from-slate-700 to-indigo-900'
  return 'from-slate-500 to-blue-800'
}

export interface MeteoCurrent {
  temperature: number
  ressenti: number
  humidite: number
  precipitation: number
  vent: number
  ventDirection: number
  code: number
  jour: boolean
}
export interface MeteoHeure { time: string; temp: number; precip: number; code: number }
export interface MeteoJour {
  date: string; code: number; max: number; min: number
  lever: string; coucher: string; uv: number; precipProb: number; ventMax: number
}
export interface Meteo {
  current: MeteoCurrent
  heures: MeteoHeure[]
  jours: MeteoJour[]
}

// Source primaire : Open-Meteo (7 jours, horaire 1 h, jour/nuit réel).
async function fromOpenMeteo(): Promise<Meteo | null> {
  let data: any
  try {
    const res = await fetch(URL, { next: { revalidate: 1800 } }) // 30 min
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }

  const cur = data?.current
  const h = data?.hourly
  const d = data?.daily
  if (!cur || !h?.time || !d?.time) return null

  const current: MeteoCurrent = {
    temperature: cur.temperature_2m,
    ressenti: cur.apparent_temperature,
    humidite: cur.relative_humidity_2m,
    precipitation: cur.precipitation,
    vent: cur.wind_speed_10m,
    ventDirection: cur.wind_direction_10m,
    code: cur.weather_code,
    jour: cur.is_day === 1,
  }

  // Prochaines 24 h à partir de l'heure courante
  const heures: MeteoHeure[] = h.time
    .map((t: string, i: number) => ({
      time: t,
      temp: Math.round(h.temperature_2m[i]),
      precip: h.precipitation_probability?.[i] ?? 0,
      code: h.weather_code[i],
    }))
    .filter((x: MeteoHeure) => x.time >= cur.time)
    .slice(0, 24)

  const jours: MeteoJour[] = d.time.map((t: string, i: number) => ({
    date: t,
    code: d.weather_code[i],
    max: Math.round(d.temperature_2m_max[i]),
    min: Math.round(d.temperature_2m_min[i]),
    lever: (d.sunrise[i] ?? '').slice(11, 16),
    coucher: (d.sunset[i] ?? '').slice(11, 16),
    uv: Math.round(d.uv_index_max[i] ?? 0),
    precipProb: d.precipitation_probability_max?.[i] ?? 0,
    ventMax: Math.round(d.wind_speed_10m_max?.[i] ?? 0),
  }))

  return { current, heures, jours }
}

// ── Source de secours : wttr.in (codes WWO remappés sur WMO, prévisions 3 jours / pas de 3 h)
const WWO_TO_WMO: Record<number, number> = {
  113: 0, 116: 2, 119: 3, 122: 3,
  143: 45, 248: 45, 260: 48,
  176: 80, 263: 51, 266: 53, 281: 56, 284: 57,
  293: 61, 296: 61, 299: 63, 302: 63, 305: 65, 308: 65,
  311: 66, 314: 67, 317: 66, 320: 67,
  323: 71, 326: 71, 329: 73, 332: 73, 335: 75, 338: 75,
  350: 77, 374: 77, 377: 77,
  353: 80, 356: 81, 359: 82, 362: 80, 365: 81, 368: 85, 371: 86,
  179: 71, 182: 71, 185: 56, 227: 73, 230: 75,
  200: 95, 386: 95, 389: 96, 392: 95, 395: 99,
}
const wwoToWmo = (c: string | number) => WWO_TO_WMO[Number(c)] ?? 3

// "05:51 AM" → minutes depuis minuit
function ampmMinutes(s: string): number {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(s ?? '')
  if (!m) return 0
  const h = (parseInt(m[1], 10) % 12) + (/PM/i.test(m[3]) ? 12 : 0)
  return h * 60 + parseInt(m[2], 10)
}
const ampmTo24 = (s: string) => {
  const m = ampmMinutes(s)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
function parisMinutesNow(): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date()).map(x => [x.type, x.value]),
  )
  return parseInt(p.hour, 10) * 60 + parseInt(p.minute, 10)
}

async function fromWttr(): Promise<Meteo | null> {
  let data: any
  try {
    const res = await fetch(`https://wttr.in/${FLEURIEUX.lat},${FLEURIEUX.lon}?format=j1`, {
      next: { revalidate: 1800 },
      headers: { 'User-Agent': 'curl/8' }, // wttr.in renvoie le JSON aux clients non-navigateur
    })
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }

  const cur = data?.current_condition?.[0]
  const days = data?.weather
  if (!cur || !Array.isArray(days) || !days.length) return null

  const lever0 = ampmMinutes(days[0].astronomy?.[0]?.sunrise)
  const coucher0 = ampmMinutes(days[0].astronomy?.[0]?.sunset)
  const nowMin = parisMinutesNow()

  const current: MeteoCurrent = {
    temperature: Number(cur.temp_C),
    ressenti: Number(cur.FeelsLikeC),
    humidite: Number(cur.humidity),
    precipitation: Number(cur.precipMM),
    vent: Number(cur.windspeedKmph),
    ventDirection: Number(cur.winddirDegree),
    code: wwoToWmo(cur.weatherCode),
    jour: nowMin >= lever0 && nowMin < coucher0,
  }

  const heuresAll: MeteoHeure[] = days.flatMap((d: any) =>
    (d.hourly ?? []).map((h: any) => ({
      time: `${d.date}T${String(h.time).padStart(4, '0').slice(0, 2)}:00`,
      temp: Math.round(Number(h.tempC)),
      precip: Number(h.chanceofrain ?? 0),
      code: wwoToWmo(h.weatherCode),
    })),
  )
  const nowIso = `${days[0].date}T${String(Math.floor(nowMin / 60)).padStart(2, '0')}:00`
  const heures = heuresAll.filter(x => x.time >= nowIso).slice(0, 9)

  const jours: MeteoJour[] = days.map((d: any) => {
    const hourly: any[] = d.hourly ?? []
    return {
      date: d.date,
      code: wwoToWmo(hourly[4]?.weatherCode ?? hourly[0]?.weatherCode ?? cur.weatherCode),
      max: Math.round(Number(d.maxtempC)),
      min: Math.round(Number(d.mintempC)),
      lever: ampmTo24(d.astronomy?.[0]?.sunrise),
      coucher: ampmTo24(d.astronomy?.[0]?.sunset),
      uv: Math.round(Number(d.uvIndex ?? 0)),
      precipProb: hourly.reduce((m, h) => Math.max(m, Number(h.chanceofrain ?? 0)), 0),
      ventMax: Math.round(hourly.reduce((m, h) => Math.max(m, Number(h.windspeedKmph ?? 0)), 0)),
    }
  })

  return { current, heures, jours }
}

// Open-Meteo en priorité, wttr.in en secours si indisponible.
export async function getMeteo(): Promise<Meteo | null> {
  return (await fromOpenMeteo()) ?? (await fromWttr())
}
