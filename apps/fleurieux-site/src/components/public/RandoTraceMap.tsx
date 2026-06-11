'use client'
import { MapContainer, TileLayer, Polyline } from 'react-leaflet'
import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'

interface Props {
  geojson: string
}

export function RandoTraceMap({ geojson }: Props) {
  let segments: [number, number][][] = []
  try {
    const geo = JSON.parse(geojson)
    const coords: [number, number][][] =
      geo.type === 'MultiLineString' ? geo.coordinates
      : geo.type === 'LineString' ? [geo.coordinates]
      : []
    // GeoJSON est en [lon, lat] → Leaflet attend [lat, lon]
    segments = coords.map(seg => seg.map(([lon, lat]) => [lat, lon] as [number, number]))
  } catch {
    return null
  }

  const all = segments.flat()
  if (all.length === 0) return null

  const lats = all.map(p => p[0])
  const lons = all.map(p => p[1])
  const bounds: LatLngBoundsExpression = [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ]

  return (
    <div className="h-72 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
      <MapContainer bounds={bounds} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={segments as LatLngExpression[][]} pathOptions={{ color: '#16a34a', weight: 4 }} />
      </MapContainer>
    </div>
  )
}
