import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { moduleActif } from '@/lib/modules'
import { logger } from '@/lib/logger'

const schema = z.object({
  type: z.enum(['ECLAIRAGE', 'VOIRIE', 'PROPRETE', 'ESPACES_VERTS', 'MOBILIER', 'AUTRE']).default('AUTRE'),
  description: z.string().min(5).max(1000),
  localisation: z.string().max(200).optional(),
  prenomAuteur: z.string().max(50).optional(),
  contact: z.string().max(120).optional(),
})

export async function POST(req: NextRequest) {
  try {
    if (!(await moduleActif('signalement'))) {
      return NextResponse.json({ error: 'Module désactivé' }, { status: 403 })
    }
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    await prisma.signalement.create({ data: { ...parsed.data, statut: 'NOUVEAU' } })

    return NextResponse.json(
      { message: 'Signalement transmis à la mairie. Merci !' },
      { status: 201 },
    )
  } catch (err) {
    logger.error('[POST /api/signalements]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
