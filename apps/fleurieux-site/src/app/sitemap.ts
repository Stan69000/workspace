import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://fleurieux.info'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [acteurs, evenements, randos, actus] = await Promise.all([
    prisma.acteur.findMany({ where: { statut: 'PUBLIE' }, select: { slug: true, updatedAt: true } }),
    prisma.evenement.findMany({ where: { statut: 'PUBLIE' }, select: { slug: true, updatedAt: true } }),
    prisma.rando.findMany({ where: { statut: 'PUBLIE' }, select: { slug: true, updatedAt: true } }),
    prisma.actu.findMany({ where: { statut: 'PUBLIE' }, select: { slug: true, updatedAt: true } }),
  ])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/acteurs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/agenda`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/randos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/actus`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
  ]

  return [
    ...staticRoutes,
    ...acteurs.map(a => ({
      url: `${BASE_URL}/acteurs/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...evenements.map(e => ({
      url: `${BASE_URL}/agenda/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...randos.map(r => ({
      url: `${BASE_URL}/randos/${r.slug}`,
      lastModified: r.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...actus.map(a => ({
      url: `${BASE_URL}/actus/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
}
