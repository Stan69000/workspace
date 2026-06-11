import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireStaff } from '@/lib/admin-guard'
import { logger } from '@/lib/logger'

const schema = z.object({
  type: z.enum(['ORDURES_MENAGERES', 'TRI_SELECTIF', 'VERRE', 'DECHETS_VERTS', 'ENCOMBRANTS']),
  jour: z.enum(['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']),
  frequence: z.enum(['HEBDOMADAIRE', 'SEMAINES_PAIRES', 'SEMAINES_IMPAIRES']).default('HEBDOMADAIRE'),
  note: z.string().max(200).optional(),
})

export async function POST(req: NextRequest) {
  try {
    if (!(await requireStaff(req.headers))) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    await prisma.collecteDechets.create({ data: parsed.data })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/collectes]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
