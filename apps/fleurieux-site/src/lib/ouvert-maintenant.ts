// src/lib/ouvert-maintenant.ts
import type { Horaire } from '@prisma/client'
import { jourCourant } from './utils'

export type StatutOuverture = {
  ouvert: boolean
  label: string
  fermeture?: string | null
  indetermine?: boolean
}

export function getStatutOuverture(horaires: Horaire[], horairesNote?: string | null): StatutOuverture {
  // Pas d'horaires fixes (ex. traiteur sur commande) : pas de statut ouvert/fermé
  if (horaires.length === 0) {
    return { ouvert: false, indetermine: true, label: horairesNote ? 'Sur commande' : 'Horaires non communiqués' }
  }

  const jour = jourCourant()
  const horaire = horaires.find(h => h.jour === jour)

  if (!horaire || !horaire.ouvert) {
    return { ouvert: false, label: 'Fermé aujourd\'hui' }
  }

  if (!horaire.ouverture || !horaire.fermeture) {
    return { ouvert: true, label: 'Ouvert', fermeture: null }
  }

  const now = new Date()
  const [hOuv, mOuv] = horaire.ouverture.split(':').map(Number)
  const [hFerm, mFerm] = horaire.fermeture.split(':').map(Number)
  const minutesNow  = now.getHours() * 60 + now.getMinutes()
  const minutesOuv  = hOuv * 60 + mOuv
  const minutesFerm = hFerm * 60 + mFerm

  if (minutesNow < minutesOuv) {
    return { ouvert: false, label: `Ouvre à ${horaire.ouverture}` }
  }
  if (minutesNow >= minutesFerm) {
    return { ouvert: false, label: `Fermé — a fermé à ${horaire.fermeture}` }
  }

  const minutesAvantFermeture = minutesFerm - minutesNow
  if (minutesAvantFermeture <= 30) {
    return { ouvert: true, label: `Ferme bientôt (${horaire.fermeture})`, fermeture: horaire.fermeture }
  }

  return { ouvert: true, label: `Ouvert jusqu'à ${horaire.fermeture}`, fermeture: horaire.fermeture }
}
