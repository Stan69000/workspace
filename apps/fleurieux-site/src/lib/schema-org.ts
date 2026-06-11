// src/lib/schema-org.ts
import type { Acteur, Categorie, Horaire } from '@prisma/client'

const JOURS_SCHEMA: Record<string, string> = {
  LUNDI:    'Monday',
  MARDI:    'Tuesday',
  MERCREDI: 'Wednesday',
  JEUDI:    'Thursday',
  VENDREDI: 'Friday',
  SAMEDI:   'Saturday',
  DIMANCHE: 'Sunday',
}

export function localBusinessSchema(
  acteur: Acteur & { categorie: Categorie; horaires: Horaire[] },
  url: string,
) {
  const openingHours = acteur.horaires
    .filter(h => h.ouvert && h.ouverture && h.fermeture)
    .map(h => `${JOURS_SCHEMA[h.jour]} ${h.ouverture}-${h.fermeture}`)

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: acteur.nom,
    description: acteur.description ?? undefined,
    url,
    address: {
      '@type': 'PostalAddress',
      streetAddress: acteur.adresse ?? undefined,
      postalCode: acteur.codePostal ?? '69210',
      addressLocality: acteur.ville ?? "Fleurieux-sur-l'Arbresle",
      addressCountry: 'FR',
    },
    ...(acteur.telephone && { telephone: acteur.telephone }),
    ...((acteur.siteWeb || acteur.instagram) && {
      sameAs: [acteur.siteWeb, acteur.instagram].filter(Boolean),
    }),
    ...(acteur.latitude && acteur.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude:  acteur.latitude,
        longitude: acteur.longitude,
      },
    }),
    ...(openingHours.length > 0 && { openingHours }),
  }
}
