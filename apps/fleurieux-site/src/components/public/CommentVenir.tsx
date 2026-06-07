'use client'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  lat: number
  lon: number
  nom: string
  adresse?: string | null
}

export function CommentVenir({ lat, lon, nom, adresse }: Props) {
  const osmDirectionsUrl = `https://www.openstreetmap.org/directions?from=&to=${lat},${lon}`

  return (
    <div className="space-y-3">
      {/* Carte décorative — non interactive au clavier */}
      <div
        className="h-56 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
        aria-hidden="true"
      >
        <MapContainer center={[lat, lon]} zoom={16} className="h-full w-full" zoomControl={false} scrollWheelZoom={false}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[lat, lon]} />
        </MapContainer>
      </div>
      {adresse && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span aria-hidden="true">📍 </span>
          <span className="sr-only">Adresse : </span>
          {adresse}
        </p>
      )}
      <a
        href={osmDirectionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg border border-village-300 px-4 py-2 text-sm font-medium text-village-700 hover:bg-village-50 dark:border-village-700 dark:text-village-400 dark:hover:bg-village-900/20"
      >
        <span aria-hidden="true">🗺️ </span>
        Itinéraire via OpenStreetMap
        <span className="sr-only">(ouvre dans un nouvel onglet)</span>
      </a>
    </div>
  )
}
