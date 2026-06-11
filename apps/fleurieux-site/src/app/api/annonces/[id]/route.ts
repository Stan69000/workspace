import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireStaff } from '@/lib/admin-guard'
import { logger } from '@/lib/logger'

const patchSchema = z.object({
  statut: z.enum(['PUBLIE', 'EN_ATTENTE', 'ARCHIVE', 'BROUILLON']),
})

interface Ctx { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    if (!(await requireStaff(req.headers))) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const { id } = await params
    const parsed = patchSchema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    await prisma.annonce.update({ where: { id }, data: { statut: parsed.data.statut } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('[PATCH /api/annonces/:id]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    if (!(await requireStaff(req.headers))) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const { id } = await params
    await prisma.annonce.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('[DELETE /api/annonces/:id]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
