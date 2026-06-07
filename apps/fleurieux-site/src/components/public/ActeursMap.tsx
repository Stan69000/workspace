'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'
import type { ActeurCarte } from '@/types'

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Coordonnées du centre de Fleurieux-sur-l'Arbresle
const CENTER: [number, number] = [45.836, 4.618]
const ZOOM = 14

interface Props {
  acteurs: (ActeurCarte & { latitude?: number | null; longitude?: number | null })[]
}

export function ActeursMap({ acteurs }: Props) {
  const geolocated = acteurs.filter(a => a.latitude && a.longitude)

  return (
    <section aria-label="Carte et liste des acteurs locaux géolocalisés">
      {/* Carte visuelle — inaccessible au clavier, un fallback liste suit */}
      <div
        className="h-[420px] w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
        aria-hidden="true"
      >
        <MapContainer center={CENTER} zoom={ZOOM} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geolocated.map(acteur => (
            <Marker key={acteur.id} position={[acteur.latitude!, acteur.longitude!]}>
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-semibold">{acteur.nom}</p>
                  <p className="text-xs text-gray-500">{acteur.categorie.nom}</p>
                  {acteur.adresse && <p className="text-xs mt-1">{acteur.adresse}</p>}
                  <Link href={`/acteurs/${acteur.slug}`} className="mt-2 block text-xs text-blue-600 hover:underline">
                    Voir la fiche
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Fallback textuel accessible — visible aux AT, masqué visuellement */}
      <div className="sr-only">
        <h3>{geolocated.length} acteur{geolocated.length > 1 ? 's' : ''} géolocalisé{geolocated.length > 1 ? 's' : ''}</h3>
        <ul>
          {geolocated.map(acteur => (
            <li key={acteur.id}>
              <Link href={`/acteurs/${acteur.slug}`}>
                {acteur.nom} — {acteur.categorie.nom}
                {acteur.adresse ? ` — ${acteur.adresse}` : ''}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
