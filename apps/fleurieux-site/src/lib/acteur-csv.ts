// Format CSV/JSON partagé entre l'export et l'import des acteurs (round-trip).
import type { Jour } from '@prisma/client'

export const JOURS: Jour[] = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']

export const HORAIRE_COL: Record<Jour, string> = {
  LUNDI: 'horaire_lundi',
  MARDI: 'horaire_mardi',
  MERCREDI: 'horaire_mercredi',
  JEUDI: 'horaire_jeudi',
  VENDREDI: 'horaire_vendredi',
  SAMEDI: 'horaire_samedi',
  DIMANCHE: 'horaire_dimanche',
}

// Ordre des colonnes du fichier exporté (= colonnes acceptées à l'import).
export const CSV_COLUMNS = [
  'nom', 'slug', 'categorieSlug', 'emoji',
  'description', 'descriptionLongue',
  'adresse', 'codePostal', 'ville',
  'telephone', 'email', 'siteWeb', 'instagram',
  'accepteEspeces', 'accepteCB', 'accepteCheque', 'accepteVirement',
  ...JOURS.map(j => HORAIRE_COL[j]),
  'horairesNote', 'photos', 'statut', 'etatMaj', 'noteMaj',
]

export function boolToCsv(b: boolean): string {
  return b ? 'oui' : 'non'
}

// undefined = colonne absente (ne pas modifier) ; sinon true/false.
export function parseBool(v: string | undefined): boolean | undefined {
  if (v == null) return undefined
  const s = v.trim().toLowerCase()
  if (s === '') return undefined
  if (['oui', 'true', '1', 'x', 'yes', 'vrai', 'o'].includes(s)) return true
  if (['non', 'false', '0', 'no', 'faux', 'n'].includes(s)) return false
  return undefined
}

export type HoraireSlot = { ouvert: boolean; ouverture: string | null; fermeture: string | null }

// "08:00-18:00" -> ouvert ; "fermé" -> fermé ; "" ou format inconnu -> null (pas de ligne)
export function parseHoraire(v: string | undefined): HoraireSlot | null {
  if (v == null) return null
  const s = v.trim()
  if (s === '') return null
  if (/^(fermé|ferme|closed|non)$/i.test(s)) return { ouvert: false, ouverture: null, fermeture: null }
  const m = s.match(/^(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/)
  if (m) return { ouvert: true, ouverture: m[1], fermeture: m[2] }
  return null
}

export function formatHoraire(h: HoraireSlot | undefined): string {
  if (!h) return ''
  if (!h.ouvert) return 'fermé'
  return h.ouverture && h.fermeture ? `${h.ouverture}-${h.fermeture}` : ''
}

// null = colonne absente (ne pas toucher) ; [] = vider ; sinon liste d'URLs.
export function parsePhotos(v: string | undefined): string[] | null {
  if (v == null) return null
  return v.split(/[|\n;]+/).map(u => u.trim()).filter(u => /^https?:\/\//i.test(u))
}
