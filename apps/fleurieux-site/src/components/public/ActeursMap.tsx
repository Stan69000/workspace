'use client'
import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css'
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css'
import L from 'leaflet'
import type { ActeurMapData } from '@/types'

const CENTER: [number, number] = [45.836, 4.618]
const ZOOM = 14

const PALETTE = [
  '#16a34a', '#2563eb', '#dc2626', '#d97706',
  '#7c3aed', '#db2777', '#0891b2', '#65a30d',
]

function couleurCategorie(slug: string): string {
  let hash = 0
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) & 0xff
  return PALETTE[hash % PALETTE.length]
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function creerIcone(acteur: ActeurMapData, selectionne: boolean): L.DivIcon {
  const color = couleurCategorie(acteur.categorie.slug)
  const emoji = escHtml(acteur.emoji ?? acteur.categorie.emoji ?? '📍')
  const size = selectionne ? 48 : 36
  const fontSize = Math.round(size * 0.46)
  const ring = selectionne
    ? `box-shadow:0 0 0 3px white,0 0 0 5px ${color};`
    : 'box-shadow:0 2px 8px rgba(0,0,0,0.35);'

  const style = [
    `width:${size}px`, `height:${size}px`, `background:${color}`,
    'border-radius:50%', 'border:3px solid white', ring,
    'display:flex', 'align-items:center', 'justify-content:center',
    `font-size:${fontSize}px`, 'transition:all 0.2s',
  ].join(';')

  return L.divIcon({
    html: `<div aria-hidden="true" style="${style}">${emoji}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 5],
  })
}

function creerIconeLocalisation(): L.DivIcon {
  return L.divIcon({
    html: '<div aria-hidden="true" style="width:16px;height:16px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(37,99,235,0.3)"></div>',
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function LocationMarker() {
  const [pos, setPos] = useState<L.LatLng | null>(null)

  useMapEvents({
    locationfound(e) { setPos(e.latlng) },
  })

  if (!pos) return null
  return <Marker position={pos} icon={creerIconeLocalisation()} title="Vous êtes ici" />
}

function InvalidateSizeOnMount() {
  const map = useMap()
  useEffect(() => {
    const fix = () => {
      map.invalidateSize({ animate: false })
      map.setView(CENTER, ZOOM, { animate: false })
    }
    const ids = [setTimeout(fix, 50), setTimeout(fix, 300)]
    let debounce: ReturnType<typeof setTimeout>
    const observer = new ResizeObserver(entries => {
      if (entries[0].contentRect.width > 0) {
        clearTimeout(debounce)
        debounce = setTimeout(fix, 30)
      }
    })
    observer.observe(map.getContainer())
    return () => {
      ids.forEach(clearTimeout)
      clearTimeout(debounce)
      observer.disconnect()
    }
  }, [map])
  return null
}

function LocateControl() {
  const map = useMap()

  useEffect(() => {
    const Control = L.Control.extend({
      options: { position: 'topright' as L.ControlPosition },
      onAdd() {
        const btn = L.DomUtil.create('button', '')
        btn.textContent = '📍'
        btn.title = 'Me localiser'
        btn.setAttribute('aria-label', 'Me localiser sur la carte')
        btn.style.cssText = [
          'width:30px', 'height:30px', 'font-size:14px', 'cursor:pointer',
          'background:white', 'border:2px solid rgba(0,0,0,0.2)', 'border-radius:4px',
          'display:flex', 'align-items:center', 'justify-content:center', 'line-height:1',
        ].join(';')
        L.DomEvent.on(btn, 'click', () => map.locate({ setView: true, maxZoom: 16 }))
        L.DomEvent.disableClickPropagation(btn)
        return btn
      },
    })
    const ctrl = new Control()
    ctrl.addTo(map)
    return () => { ctrl.remove() }
  }, [map])

  return null
}

interface Props {
  acteurs: ActeurMapData[]
  acteurSelectionne: ActeurMapData | null
  onSelectActeur: (acteur: ActeurMapData) => void
}

export function ActeursMap({ acteurs, acteurSelectionne, onSelectActeur }: Props) {
  const geolocated = acteurs.filter(a => a.latitude && a.longitude)

  return (
    <div
      role="application"
      aria-label="Carte interactive des acteurs locaux de Fleurieux-sur-l'Arbresle"
      className="relative h-full w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
    >
      <a
        href="#liste-acteurs"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[1002] focus:rounded focus:bg-white focus:px-3 focus:py-1 focus:text-sm focus:shadow"
      >
        Aller à la liste des acteurs
      </a>

      <MapContainer
        center={CENTER}
        zoom={ZOOM}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InvalidateSizeOnMount />
        <LocateControl />
        <LocationMarker />
        <MarkerClusterGroup chunkedLoading>
          {geolocated.map(acteur => (
            <Marker
              key={`${acteur.id}-${acteur.id === acteurSelectionne?.id}`}
              position={[acteur.latitude!, acteur.longitude!]}
              icon={creerIcone(acteur, acteur.id === acteurSelectionne?.id)}
              title={acteur.nom}
              eventHandlers={{ click: () => onSelectActeur(acteur) }}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="font-semibold">{acteur.emoji} {acteur.nom}</p>
                  <p className="text-xs text-gray-500">{acteur.categorie.nom}</p>
                  {acteur.adresse && <p className="text-xs mt-1">{acteur.adresse}</p>}
                  <button
                    className="mt-2 block text-xs text-village-600 hover:underline w-full text-left"
                    onClick={() => onSelectActeur(acteur)}
                  >
                    Voir la fiche →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {geolocated.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80 rounded-xl pointer-events-none">
          <p className="text-sm text-gray-500">Aucun acteur géolocalisé</p>
        </div>
      )}
    </div>
  )
}
