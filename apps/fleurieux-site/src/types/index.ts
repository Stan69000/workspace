// src/types/index.ts
// Types partagés dans tout le projet

import type { Acteur, Categorie, Horaire, Photo, Evenement, Rando } from '@prisma/client'

export type { Horaire }

// ── Acteur enrichi pour les pages publiques
export type ActeurAvecRelations = Acteur & {
  categorie: Categorie
  horaires: Horaire[]
  photos: Photo[]
}

// ── Acteur carte (léger, pour les listes)
export type ActeurCarte = Pick<Acteur,
  'id' | 'slug' | 'nom' | 'emoji' | 'description' |
  'adresse' | 'telephone' | 'statut'
> & {
  categorie: Pick<Categorie, 'nom' | 'slug' | 'emoji'>
  photos: Pick<Photo, 'url' | 'alt'>[]
}

// ── Acteur pour la carte interactive (avec coordonnées et horaires)
export type ActeurMapData = ActeurCarte & {
  latitude?: number | null
  longitude?: number | null
  horairesNote?: string | null
  horaires: Pick<Horaire, 'jour' | 'ouvert' | 'ouverture' | 'fermeture'>[]
  distanceKm?: number
}

// ── Horaire ouvert aujourd'hui
export type HoraireAujourdhui = {
  ouvert: boolean
  ouverture?: string | null
  fermeture?: string | null
  horairesNote?: string | null
}

// ── Événement enrichi
export type EvenementAvecActeur = Evenement & {
  acteur?: Pick<Acteur, 'nom' | 'slug'> | null
}

// ── Rôles admin
export type UserRole = 'ADMIN' | 'MODERATEUR' | 'CONTRIBUTEUR' | 'HABITANT'

// ── Transports

export type TrainDeparture = {
  tripId: string
  direction: 'vers_lyon' | 'vers_sain_bel'
  destination: string
  departureTime: number   // Unix timestamp UTC
  delaySeconds: number
  cancelled: boolean
}

export type TrainAlert = {
  id: string
  headerText: string
  descriptionText: string
  cause: string
  effect: string
  activePeriods: { start: number; end: number | null }[]
}

export type TransportsData = {
  departures: TrainDeparture[]
  alerts: TrainAlert[]
  fetchedAt: number       // Unix timestamp UTC
}

// ── Réponse API standard
export type ApiResponse<T> = {
  data?: T
  error?: string
  message?: string
}

// ── Pagination
export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
