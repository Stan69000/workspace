// Saint du jour via Nominis (Conférence des évêques de France) — référence francophone, sans clé.
// https://nominis.cef.fr/json/nominis.php?jour=JJ&mois=MM

import { parisJourMois } from '@/lib/paris'

export interface SaintDuJour {
  saints: string[]   // ex. ["Saint Barnabé"]
  prenoms: string[]  // prénoms fêtés, ex. ["Barnabé", "Yolande"]
  lien?: string
}

export async function getSaintDuJour(date = new Date()): Promise<SaintDuJour | null> {
  const { jour, mois } = parisJourMois(date)
  const url = `https://nominis.cef.fr/json/nominis.php?jour=${jour}&mois=${mois}`

  let data: any
  try {
    const res = await fetch(url, { next: { revalidate: 21600 } }) // 6 h
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }

  const majeurs = data?.response?.saints?.majeurs
  const saintsObj = majeurs && typeof majeurs === 'object' ? Object.values<any>(majeurs) : []
  const saints = saintsObj.map(s => s?.valeur).filter(Boolean) as string[]

  const prenomsSrc = data?.response?.prenoms?.majeurs
  const prenoms = prenomsSrc && typeof prenomsSrc === 'object' ? Object.keys(prenomsSrc) : []

  const lien = saintsObj[0]?.lien as string | undefined

  if (!saints.length && !prenoms.length) return null
  return { saints, prenoms, lien }
}
