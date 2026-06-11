// src/lib/modules.ts
// Modules activables/désactivables depuis l'admin. Par défaut tout est actif ;
// un flag en base à false désactive le module (pages + entrées de nav + API).
import { cache } from 'react'
import { prisma } from './prisma'

export const MODULES = [
  { key: 'agenda',          label: 'Agenda',              href: '/agenda' },
  { key: 'infos-pratiques', label: 'Infos pratiques',     href: '/infos-pratiques' },
  { key: 'annonces',        label: 'Petites annonces',    href: '/annonces' },
  { key: 'signalement',     label: 'Signaler un problème', href: '/signaler' },
  { key: 'randos',          label: 'Randonnées',          href: '/randos' },
  { key: 'actus',           label: 'Actualités',          href: '/actus' },
] as const

export type ModuleKey = typeof MODULES[number]['key']

// Map { key: actif }. Dédupliqué par requête via cache().
export const getModules = cache(async (): Promise<Record<string, boolean>> => {
  const map: Record<string, boolean> = {}
  for (const m of MODULES) map[m.key] = true
  try {
    const flags = await prisma.moduleFlag.findMany()
    for (const f of flags) map[f.key] = f.actif
  } catch {
    // en cas d'erreur DB, on garde tout actif (défaut)
  }
  return map
})

export async function moduleActif(key: ModuleKey): Promise<boolean> {
  return (await getModules())[key] !== false
}
