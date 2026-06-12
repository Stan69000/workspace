import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Statut, EtatMaj } from '@prisma/client'
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
  descriptionLongue: z.string().optional(),
  horairesNote: z.string().optional(),
  statut: z.enum(['PUBLIE', 'BROUILLON']).default('BROUILLON'),
  etatMaj: z.enum(['ACTIF', 'A_VERIFIER', 'MODIFIE', 'FERME']).optional(),
  noteMaj: z.string().optional(),
})

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1).max(1000),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    const role = session?.user.role ?? ''
    if (!session || !['ADMIN', 'CONTRIBUTEUR'].includes(role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const isAdmin = role === 'ADMIN'

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

        const existing = await prisma.acteur.findUnique({
          where: { slug: row.slug },
          select: { id: true, contributeurId: true, adresse: true, latitude: true },
        })

        // H1 : un CONTRIBUTEUR ne peut écraser que ses propres fiches
        if (existing && !isAdmin && existing.contributeurId !== session.user.id) {
          results.push({ slug: row.slug, action: 'error', error: 'Fiche appartenant à un autre contributeur' })
          continue
        }

        // H1 : un CONTRIBUTEUR ne publie jamais directement (passe par la modération)
        const statut: Statut = isAdmin ? (row.statut as Statut) : Statut.EN_ATTENTE

        const data: Record<string, unknown> = {
          nom: row.nom,
          categorieId: categorie.id,
          description: row.description || null,
          descriptionLongue: row.descriptionLongue || null,
          adresse: row.adresse || null,
          codePostal: row.codePostal || null,
          ville: row.ville || null,
          telephone: row.telephone || null,
          email: row.email || null,
          siteWeb: row.siteWeb || null,
          instagram: row.instagram || null,
          horairesNote: row.horairesNote || null,
          noteMaj: row.noteMaj || null,
          statut,
        }
        // etatMaj seulement si fourni (ne pas écraser/forcer le défaut à l'update)
        if (row.etatMaj) data.etatMaj = row.etatMaj as EtatMaj

        // Géocodage uniquement si l'adresse a changé, ou nouvelle fiche, ou coords manquantes
        const adresseChange = (row.adresse || null) !== (existing?.adresse ?? null)
        if (row.adresse && (!existing || adresseChange || existing.latitude == null)) {
          const coords = await geocodeAdresse(row.adresse, row.codePostal, row.ville)
          if (coords) {
            data.latitude = coords.lat
            data.longitude = coords.lon
          }
        } else if (!row.adresse) {
          data.latitude = null
          data.longitude = null
        }

        if (existing) {
          await prisma.acteur.update({ where: { slug: row.slug }, data })
          results.push({ slug: row.slug, action: 'updated' })
        } else {
          await prisma.acteur.create({ data: { ...data, slug: row.slug, contributeurId: session.user.id } })
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
