import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin-guard'
import { MODULES } from '@/lib/modules'
import { logger } from '@/lib/logger'

const schema = z.object({ actif: z.boolean() })
const KEYS = MODULES.map(m => m.key) as string[]

interface Ctx { params: Promise<{ key: string }> }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    if (!(await requireAdmin(req.headers))) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    const { key } = await params
    if (!KEYS.includes(key)) return NextResponse.json({ error: 'Module inconnu' }, { status: 400 })
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 })

    await prisma.moduleFlag.upsert({
      where: { key },
      update: { actif: parsed.data.actif },
      create: { key, actif: parsed.data.actif },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('[PATCH /api/modules/:key]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
