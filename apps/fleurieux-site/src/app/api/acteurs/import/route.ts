import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { geocodeAdresse } from '@/lib/geocode'
import { logger } from '@/lib/logger'

const rowSchema = z.object({
  nom: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  categorieSlug: z.string().min(1),
  description: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  siteWeb: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  statut: z.enum(['PUBLIE', 'BROUILLON']).default('BROUILLON'),
})

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(200),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session || !['ADMIN', 'CONTRIBUTEUR'].includes(session.user.role ?? '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const results: { slug: string; action: 'created' | 'updated' | 'error'; error?: string }[] = []

    for (const row of parsed.data.rows) {
      try {
        const categorie = await prisma.categorie.findUnique({ where: { slug: row.categorieSlug } })
        if (!categorie) {
          results.push({ slug: row.slug, action: 'error', error: `Catégorie "${row.categorieSlug}" introuvable` })
          continue
        }

        let latitude: number | null = null
        let longitude: number | null = null
        if (row.adresse) {
          const coords = await geocodeAdresse(row.adresse, row.codePostal, row.ville)
          if (coords) {
            latitude = coords.lat
            longitude = coords.lon
          }
        }

        const data = {
          nom: row.nom,
          categorieId: categorie.id,
          description: row.description ?? null,
          adresse: row.adresse ?? null,
          codePostal: row.codePostal ?? null,
          ville: row.ville ?? null,
          telephone: row.telephone ?? null,
          email: row.email || null,
          siteWeb: row.siteWeb || null,
          instagram: row.instagram || null,
          statut: row.statut,
          latitude,
          longitude,
        }

        const existing = await prisma.acteur.findUnique({ where: { slug: row.slug } })
        if (existing) {
          await prisma.acteur.update({ where: { slug: row.slug }, data })
          results.push({ slug: row.slug, action: 'updated' })
        } else {
          await prisma.acteur.create({ data: { ...data, slug: row.slug } })
          results.push({ slug: row.slug, action: 'created' })
        }
      } catch (rowErr) {
        results.push({ slug: row.slug, action: 'error', error: String(rowErr) })
      }
    }

    const created = results.filter(r => r.action === 'created').length
    const updated = results.filter(r => r.action === 'updated').length
    const errors = results.filter(r => r.action === 'error').length

    logger.info('import CSV acteurs', { created, updated, errors, userId: session.user.id })
    return NextResponse.json({ created, updated, errors, results })
  } catch (err) {
    logger.error('[POST /api/acteurs/import]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
