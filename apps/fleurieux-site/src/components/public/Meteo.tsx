import { Card } from '@/components/ui/Card'

// Météo locale via Open-Meteo (gratuit, sans clé). Fleurieux-sur-l'Arbresle ≈ 45.82, 4.66.
const URL = 'https://api.open-meteo.com/v1/forecast?latitude=45.82&longitude=4.66'
  + '&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code'
  + '&timezone=Europe%2FParis&forecast_days=3'

const WMO: Record<number, { label: string; emoji: string }> = {
  0: { label: 'Ciel dégagé', emoji: '☀️' }, 1: { label: 'Plutôt dégagé', emoji: '🌤️' },
  2: { label: 'Partiellement nuageux', emoji: '⛅' }, 3: { label: 'Couvert', emoji: '☁️' },
  45: { label: 'Brouillard', emoji: '🌫️' }, 48: { label: 'Brouillard givrant', emoji: '🌫️' },
  51: { label: 'Bruine légère', emoji: '🌦️' }, 53: { label: 'Bruine', emoji: '🌦️' }, 55: { label: 'Bruine dense', emoji: '🌧️' },
  61: { label: 'Pluie faible', emoji: '🌦️' }, 63: { label: 'Pluie', emoji: '🌧️' }, 65: { label: 'Pluie forte', emoji: '🌧️' },
  71: { label: 'Neige faible', emoji: '🌨️' }, 73: { label: 'Neige', emoji: '🌨️' }, 75: { label: 'Neige forte', emoji: '❄️' },
  80: { label: 'Averses', emoji: '🌦️' }, 81: { label: 'Averses', emoji: '🌧️' }, 82: { label: 'Averses violentes', emoji: '⛈️' },
  95: { label: 'Orage', emoji: '⛈️' }, 96: { label: 'Orage', emoji: '⛈️' }, 99: { label: 'Orage de grêle', emoji: '⛈️' },
}
const wmo = (code: number) => WMO[code] ?? { label: '', emoji: '🌡️' }

export async function Meteo() {
  let data: any
  try {
    const res = await fetch(URL, { next: { revalidate: 1800 } })
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }
  const cur = data?.current
  const daily = data?.daily
  if (!cur || !daily?.time) return null

  const w = wmo(cur.weather_code)
  const jours: { label: string; emoji: string; max: number; min: number }[] = daily.time.map((t: string, i: number) => ({
    label: i === 0 ? "Aujourd'hui" : new Date(t).toLocaleDateString('fr-FR', { weekday: 'short' }),
    emoji: wmo(daily.weather_code[i]).emoji,
    max: Math.round(daily.temperature_2m_max[i]),
    min: Math.round(daily.temperature_2m_min[i]),
  }))

  return (
    <Card className="flex flex-wrap items-center gap-x-6 gap-y-3">
      <div className="flex items-center gap-3">
        <span className="text-4xl" aria-hidden="true">{w.emoji}</span>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(cur.temperature_2m)}°C</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Fleurieux · {w.label}</p>
        </div>
      </div>
      <ul className="ml-auto flex gap-4">
        {jours.map((j, i) => (
          <li key={i} className="text-center text-sm">
            <p className="capitalize text-gray-500 dark:text-gray-400">{j.label}</p>
            <p aria-hidden="true">{j.emoji}</p>
            <p className="text-gray-700 dark:text-gray-300">{j.max}° <span className="text-gray-400">{j.min}°</span></p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
