// src/lib/collecte.ts
// Calcul des jours de collecte (gère les fréquences hebdo / semaines paires / impaires).
import type { Jour } from '@prisma/client'

export interface Collecte {
  type: string
  jour: Jour
  frequence: string
  note?: string | null
}

const JOUR_DOW: Record<string, number> = {
  DIMANCHE: 0, LUNDI: 1, MARDI: 2, MERCREDI: 3, JEUDI: 4, VENDREDI: 5, SAMEDI: 6,
}

export const TYPE_DECHET_LABEL: Record<string, string> = {
  ORDURES_MENAGERES: 'Ordures ménagères',
  TRI_SELECTIF: 'Tri sélectif',
  VERRE: 'Verre',
  DECHETS_VERTS: 'Déchets verts',
  ENCOMBRANTS: 'Encombrants',
}

export const FREQUENCE_LABEL: Record<string, string> = {
  HEBDOMADAIRE: 'chaque semaine',
  SEMAINES_PAIRES: 'semaines paires',
  SEMAINES_IMPAIRES: 'semaines impaires',
}

// Numéro de semaine ISO 8601
export function isoWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7 // lundi = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3) // jeudi de la semaine courante
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3)
  return 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))
}

// La collecte a-t-elle lieu ce jour précis ?
export function collecteLeJour(c: Collecte, date: Date): boolean {
  if (date.getDay() !== JOUR_DOW[c.jour]) return false
  if (c.frequence === 'HEBDOMADAIRE') return true
  const pair = isoWeek(date) % 2 === 0
  if (c.frequence === 'SEMAINES_PAIRES') return pair
  if (c.frequence === 'SEMAINES_IMPAIRES') return !pair
  return false
}

// Prochaine occurrence (jour entier, dans les 28 prochains jours), ou null.
export function prochaineCollecte(c: Collecte, from: Date = new Date()): Date | null {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  for (let i = 0; i < 28; i++) {
    const day = new Date(base)
    day.setDate(base.getDate() + i)
    if (collecteLeJour(c, day)) return day
  }
  return null
}
