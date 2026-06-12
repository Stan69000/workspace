// src/lib/schema-org.ts

const JOURS_SCHEMA: Record<string, string> = {
  LUNDI:    'Monday',
  MARDI:    'Tuesday',
  MERCREDI: 'Wednesday',
  JEUDI:    'Thursday',
  VENDREDI: 'Friday',
  SAMEDI:   'Saturday',
  DIMANCHE: 'Sunday',
}

// Type structurel (découplé de Prisma) : seuls les champs publics nécessaires.
type SchemaActeur = {
  nom: string
  description: string | null
  adresse: string | null
  codePostal: string | null
  ville: string | null
  telephone: string | null
  siteWeb: string | null
  instagram: string | null
  latitude: number | null
  longitude: number | null
  horaires: { jour: string; ouvert: boolean; ouverture: string | null; fermeture: string | null }[]
}

export function localBusinessSchema(acteur: SchemaActeur, url: string) {
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
