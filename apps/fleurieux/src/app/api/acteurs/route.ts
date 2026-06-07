// src/app/api/acteurs/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import type { ApiResponse, PaginatedResponse, ActeurCarte } from '@/types'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const page     = Math.max(1, parseInt(searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '12') || 12))
    const search   = searchParams.get('q') || ''
    const categorie = searchParams.get('categorie') || ''
    const miseEnAvant = searchParams.get('miseEnAvant') === 'true'

    const where = {
      statut: 'PUBLIE' as const,
      ...(search && {
        OR: [
          { nom: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ]
      }),
      ...(categorie && { categorie: { slug: categorie } }),
      ...(miseEnAvant && { miseEnAvant: true }),
    }

    const [acteurs, total] = await Promise.all([
      prisma.acteur.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ miseEnAvant: 'desc' }, { noteAverage: 'desc' }],
        select: {
          id: true, slug: true, nom: true, emoji: true,
          description: true, adresse: true, telephone: true,
          noteAverage: true, nbAvis: true, statut: true, miseEnAvant: true,
          categorie: { select: { nom: true, slug: true, emoji: true } },
          photos: { take: 1, select: { url: true, alt: true }, orderBy: { ordre: 'asc' } },
        }
      }),
      prisma.acteur.count({ where })
    ])

    const response: PaginatedResponse<ActeurCarte> = {
      data: acteurs as ActeurCarte[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }

    return NextResponse.json(response)
  } catch (err) {
    logger.error('[GET /api/acteurs]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
