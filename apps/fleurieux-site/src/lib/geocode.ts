// src/lib/geocode.ts
// Geocoding via Nominatim (OpenStreetMap) — gratuit, pas de clé API

export type GeoResult = { lat: number; lon: number } | null

export async function geocodeAdresse(
  adresse: string,
  codePostal = '69210',
  ville = "Fleurieux-sur-l'Arbresle",
): Promise<GeoResult> {
  const query = encodeURIComponent(`${adresse}, ${codePostal} ${ville}, France`)
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'fleurieux-portail/1.0 (admin@fleurieux.info)' },
      next: { revalidate: 86400 }, // cache 24h
    })
    const data = await res.json() as { lat: string; lon: string }[]
    if (!data.length) return null
    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}
