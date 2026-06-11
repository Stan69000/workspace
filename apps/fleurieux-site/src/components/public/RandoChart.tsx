'use client'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler)

interface Props {
  // Points d'altitude simulés depuis distanceKm + deniveleM
  distanceKm: number
  deniveleM: number
  altitudeDepart?: number
}

export function RandoChart({ distanceKm, deniveleM, altitudeDepart = 320 }: Props) {
  // Profil synthétique — remplacer par données GPX réelles quand disponibles
  const points = 20
  const labels = Array.from({ length: points }, (_, i) =>
    `${((i / (points - 1)) * distanceKm).toFixed(1)} km`
  )

  // Courbe en cloche représentant la montée/descente
  const data = labels.map((_, i) => {
    const x = i / (points - 1)
    const profile = Math.sin(x * Math.PI) * deniveleM
    return Math.round(altitudeDepart + profile)
  })

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Profil altimétrique (estimé)</p>
      <div className="h-40 sm:h-48">
        <Line
          data={{
            labels,
            datasets: [{
              label: 'Altitude (m)',
              data,
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
            }],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { title: { display: true, text: 'Altitude (m)' }, grid: { color: 'rgba(0,0,0,0.05)' } },
              x: { ticks: { maxTicksLimit: 6 } },
            },
          }}
        />
      </div>
    </div>
  )
}
