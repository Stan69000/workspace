// src/types/index.ts
// Types partagés dans tout le projet

import type { Acteur, Categorie, Horaire, Photo, Avis, User, Evenement, Rando } from '@prisma/client'

// ── Acteur enrichi pour les pages publiques
export type ActeurAvecRelations = Acteur & {
  categorie: Categorie
  horaires: Horaire[]
  photos: Photo[]
  avis: Avis[]
  _count?: { avis: number }
}

// ── Acteur carte (léger, pour les listes)
export type ActeurCarte = Pick<Acteur,
  'id' | 'slug' | 'nom' | 'emoji' | 'description' |
  'adresse' | 'telephone' | 'noteAverage' | 'nbAvis' | 'statut' | 'miseEnAvant'
> & {
  categorie: Pick<Categorie, 'nom' | 'slug' | 'emoji'>
  photos: Pick<Photo, 'url' | 'alt'>[]
}

// ── Horaire ouvert aujourd'hui
export type HoraireAujourdhui = {
  ouvert: boolean
  ouverture?: string | null
  fermeture?: string | null
  horairesNote?: string | null
}

// ── Avis avec auteur
export type AvisAvecAuteur = Avis & {
  user?: Pick<User, 'name' | 'image'> | null
}

// ── Événement enrichi
export type EvenementAvecActeur = Evenement & {
  acteur?: Pick<Acteur, 'nom' | 'slug'> | null
}

// ── Rôles admin
export type UserRole = 'ADMIN' | 'MODERATEUR' | 'CONTRIBUTEUR' | 'HABITANT'

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
