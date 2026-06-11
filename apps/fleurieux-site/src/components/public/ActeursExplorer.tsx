'use client'
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import type { ActeurMapData } from '@/types'
import type { Categorie } from '@prisma/client'
import { getStatutOuverture } from '@/lib/ouvert-maintenant'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'

const ActeursMap = dynamic(
  () => import('./ActeursMap').then(m => m.ActeursMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
    ),
  },
)

const ActeurPanneauLateral = dynamic(
  () => import('./ActeurPanneauLateral').then(m => m.ActeurPanneauLateral),
  { ssr: false },
)

interface Props {
  acteurs: ActeurMapData[]
  categories: Pick<Categorie, 'slug' | 'nom' | 'emoji' | 'ordre'>[]
}

type Vue = 'liste' | 'carte'

export function ActeursExplorer({ acteurs, categories }: Props) {
  const [search, setSearch] = useState('')
  const [categorieSlug, setCategorieSlug] = useState('')
  const [ouvertSeulement, setOuvertSeulement] = useState(false)
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null)
  const [triDistance, setTriDistance] = useState(false)
  const [geoErreur, setGeoErreur] = useState('')
  const [acteurSelectionne, setActeurSelectionne] = useState<ActeurMapData | null>(null)
  const [vueMobile, setVueMobile] = useState<Vue>('liste')
  const listRef = useRef<HTMLDivElement>(null)

  const acteursFiltres = useMemo(() => {
    const q = search.toLowerCase().trim()
    const filtres = acteurs.filter(a => {
      if (categorieSlug && a.categorie.slug !== categorieSlug) return false
      if (q && !a.nom.toLowerCase().includes(q) && !(a.description ?? '').toLowerCase().includes(q)) return false
      if (ouvertSeulement) {
        const statut = getStatutOuverture(
          a.horaires as Parameters<typeof getStatutOuverture>[0],
          a.horairesNote,
        )
        if (!statut.ouvert) return false
      }
      return true
    })
    if (triDistance && position) {
      return filtres
        .map(a => ({
          ...a,
          distanceKm: a.latitude != null && a.longitude != null
            ? haversineKm(position.lat, position.lon, a.latitude, a.longitude)
            : undefined,
        }))
        .sort((x, y) => (x.distanceKm ?? Infinity) - (y.distanceKm ?? Infinity))
    }
    return filtres
  }, [acteurs, search, categorieSlug, ouvertSeulement, triDistance, position])

  const autourDeMoi = useCallback(() => {
    if (triDistance) { setTriDistance(false); return }
    if (!('geolocation' in navigator)) { setGeoErreur('Géolocalisation non disponible.'); return }
    navigator.geolocation.getCurrentPosition(
      pos => { setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setTriDistance(true); setGeoErreur('') },
      () => setGeoErreur('Localisation refusée.'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }, [triDistance])

  const handleSelectActeur = useCallback((acteur: ActeurMapData) => {
    setActeurSelectionne(acteur)
    // Scroll la card correspondante dans la liste
    const el = listRef.current?.querySelector(`[data-acteur-id="${acteur.id}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  const handleFermerPanneau = useCallback(() => setActeurSelectionne(null), [])

  // Basculer sur la carte quand on sélectionne un acteur sur mobile
  useEffect(() => {
    if (acteurSelectionne) setVueMobile('carte')
  }, [acteurSelectionne])

  return (
    <>
      {/* ── Filtres ─────────────────────────────────────── */}
      <section aria-label="Filtres des acteurs" className="space-y-3">
        {/* Recherche */}
        <div className="relative">
          <label htmlFor="recherche-acteurs" className="sr-only">Rechercher un acteur</label>
          <input
            id="recherche-acteurs"
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un acteur…"
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-sm placeholder-gray-400 focus:border-village-500 focus:outline-none focus:ring-2 focus:ring-village-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Catégories + toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setCategorieSlug('')}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              !categorieSlug
                ? 'bg-village-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300',
            )}
            aria-pressed={!categorieSlug}
          >
            Tous
          </button>
          {categories.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setCategorieSlug(c => c === cat.slug ? '' : cat.slug)}
              className={cn(
                'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                categorieSlug === cat.slug
                  ? 'bg-village-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300',
              )}
              aria-pressed={categorieSlug === cat.slug}
            >
              {cat.emoji} {cat.nom}
            </button>
          ))}

          {/* Ouvert maintenant */}
          <button
            onClick={() => setOuvertSeulement(v => !v)}
            className={cn(
              'ml-auto rounded-full px-3 py-1 text-sm font-medium transition-colors border',
              ouvertSeulement
                ? 'border-green-600 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400',
            )}
            aria-pressed={ouvertSeulement}
          >
            <span aria-hidden="true">🟢</span> Ouvert maintenant
          </button>

          {/* Autour de moi */}
          <button
            onClick={autourDeMoi}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors border',
              triDistance
                ? 'border-village-600 bg-village-50 text-village-700 dark:bg-village-900/20 dark:text-village-400'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400',
            )}
            aria-pressed={triDistance}
          >
            <span aria-hidden="true">📍</span> Autour de moi
          </button>

          {/* Toggle liste/carte — mobile seulement */}
          <div
            className="flex gap-1 rounded-lg border border-gray-200 p-0.5 dark:border-gray-700 lg:hidden"
            role="group"
            aria-label="Vue"
          >
            <button
              onClick={() => setVueMobile('liste')}
              className={cn(
                'rounded px-3 py-1 text-sm transition-colors',
                vueMobile === 'liste' ? 'bg-village-600 text-white' : 'text-gray-600 dark:text-gray-400',
              )}
              aria-pressed={vueMobile === 'liste'}
            >
              Liste
            </button>
            <button
              onClick={() => setVueMobile('carte')}
              className={cn(
                'rounded px-3 py-1 text-sm transition-colors',
                vueMobile === 'carte' ? 'bg-village-600 text-white' : 'text-gray-600 dark:text-gray-400',
              )}
              aria-pressed={vueMobile === 'carte'}
            >
              Carte
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400" aria-live="polite" aria-atomic="true">
          {acteursFiltres.length} acteur{acteursFiltres.length > 1 ? 's' : ''} affiché{acteursFiltres.length > 1 ? 's' : ''}
          {triDistance && <span> · triés par distance</span>}
        </p>
        {geoErreur && <p className="text-sm text-red-600 dark:text-red-400">{geoErreur}</p>}
      </section>

      {/* ── Vue split desktop / toggle mobile ──────────── */}
      <div className="flex gap-6">
        {/* Liste */}
        <section
          id="liste-acteurs"
          ref={listRef}
          aria-label="Liste des acteurs locaux"
          className={cn(
            'min-w-0',
            // Desktop: toujours visible, 40% de largeur
            'lg:w-2/5 lg:block',
            // Mobile: conditionnel
            vueMobile === 'carte' ? 'hidden lg:block' : 'w-full',
          )}
        >
          {acteursFiltres.length === 0 ? (
            <p className="py-16 text-center text-gray-400">Aucun acteur trouvé.</p>
          ) : (
            <div className="space-y-3 lg:max-h-[calc(100vh_-_16rem)] lg:overflow-y-auto lg:pr-1">
              {acteursFiltres.map(a => (
                <ActeurCardCompacte
                  key={a.id}
                  acteur={a}
                  selectionne={acteurSelectionne?.id === a.id}
                  onSelectCarte={handleSelectActeur}
                />
              ))}
            </div>
          )}
        </section>

        {/* Carte */}
        <section
          aria-label="Carte des acteurs"
          className={cn(
            // Desktop: toujours visible, occupe l'espace restant, collée
            'lg:flex-1 lg:block lg:sticky lg:top-20',
            'lg:h-[calc(100vh_-_16rem)]',
            // Mobile: conditionnel
            vueMobile === 'carte' ? 'w-full h-[calc(100dvh_-_12rem)]' : 'hidden lg:block',
          )}
        >
          <ActeursMap
            acteurs={acteursFiltres}
            acteurSelectionne={acteurSelectionne}
            onSelectActeur={handleSelectActeur}
          />
        </section>
      </div>

      {/* Panneau latéral */}
      <ActeurPanneauLateral
        acteur={acteurSelectionne}
        onFermer={handleFermerPanneau}
      />
    </>
  )
}

/* ── Distance (Haversine) ─────────────────────────────── */

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km: number): string {
  if (km < 1) return `à ${Math.round(km * 1000)} m`
  return `à ${km.toFixed(1).replace('.', ',')} km`
}

/* ── Card compacte pour la liste ──────────────────────── */

interface CardProps {
  acteur: ActeurMapData
  selectionne: boolean
  onSelectCarte: (acteur: ActeurMapData) => void
}

function ActeurCardCompacte({ acteur, selectionne, onSelectCarte }: CardProps) {
  const photo = acteur.photos[0]

  return (
    <div
      data-acteur-id={acteur.id}
      className={cn(
        'group flex gap-3 rounded-xl border bg-white p-3 transition-all dark:bg-gray-900',
        selectionne
          ? 'border-village-500 ring-2 ring-village-500/30 shadow-md'
          : 'border-gray-200 dark:border-gray-700 hover:border-village-300 hover:shadow-sm',
      )}
    >
      {/* Miniature */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        {photo ? (
          <Image src={photo.url} alt={photo.alt ?? acteur.nom} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl" aria-hidden="true">
            {acteur.emoji ?? '🏪'}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-village-600 dark:text-village-400">{acteur.categorie.nom}</p>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{acteur.nom}</h3>
        {acteur.distanceKm != null && (
          <p className="text-xs text-gray-400">{formatDistance(acteur.distanceKm)}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1 items-end flex-shrink-0">
        <button
          onClick={() => onSelectCarte(acteur)}
          aria-label={`Voir ${acteur.nom} sur la carte`}
          title="Voir sur la carte"
          className="rounded p-1 text-gray-400 hover:text-village-600 hover:bg-village-50 dark:hover:bg-village-900/20 focus:outline-none focus:ring-2 focus:ring-village-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <Link
          href={`/acteurs/${acteur.slug}`}
          aria-label={`Voir la fiche de ${acteur.nom}`}
          className="rounded p-1 text-gray-400 hover:text-village-600 hover:bg-village-50 dark:hover:bg-village-900/20 focus:outline-none focus:ring-2 focus:ring-village-500 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
