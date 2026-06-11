'use client'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Filler,
} from 'chart.js'
import type { MeteoHeure } from '@/lib/meteo'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

export function MeteoChart({ heures }: { heures: MeteoHeure[] }) {
  const labels = heures.map(h => h.time.slice(11, 16))
  const temps = heures.map(h => h.temp)

  return (
    <div role="img" aria-label={`Courbe des températures sur ${heures.length} heures`}>
      <Line
        data={{
          labels,
          datasets: [{
            label: 'Température (°C)',
            data: temps,
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.12)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.parsed.y}°C` } },
          },
          scales: {
            y: { ticks: { callback: v => `${v}°` }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { ticks: { maxTicksLimit: 8 }, grid: { display: false } },
          },
        }}
      />
    </div>
  )
}
