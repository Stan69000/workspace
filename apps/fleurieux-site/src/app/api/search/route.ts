import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const querySchema = z.object({
  q: z.string().min(1).max(100),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({ q: searchParams.get('q') })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètre q requis (1–100 caractères)' }, { status: 400 })
    }

    const q = parsed.data.q
    const contains = { contains: q, mode: 'insensitive' as const }

    const [acteurs, evenements, randos, actus] = await Promise.all([
      prisma.acteur.findMany({
        where: {
          statut: 'PUBLIE',
          OR: [{ nom: contains }, { description: contains }, { ville: contains }],
        },
        select: { slug: true, nom: true, description: true, categorie: { select: { nom: true } } },
        take: 5,
      }),
      prisma.evenement.findMany({
        where: {
          statut: 'PUBLIE',
          OR: [{ titre: contains }, { description: contains }, { lieu: contains }],
        },
        select: { slug: true, titre: true, description: true, dateDebut: true },
        take: 5,
      }),
      prisma.rando.findMany({
        where: {
          statut: 'PUBLIE',
          OR: [{ nom: contains }, { description: contains }],
        },
        select: { slug: true, nom: true, description: true, difficulte: true },
        take: 5,
      }),
      prisma.actu.findMany({
        where: {
          statut: 'PUBLIE',
          OR: [{ titre: contains }, { contenu: contains }],
        },
        select: { slug: true, titre: true, contenu: true, publishedAt: true },
        take: 5,
      }),
    ])

    return NextResponse.json({ acteurs, evenements, randos, actus })
  } catch (err) {
    logger.error('[GET /api/search]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
