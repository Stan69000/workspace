import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { moduleActif } from '@/lib/modules'
import { logger } from '@/lib/logger'

const schema = z.object({
  titre: z.string().min(3).max(120),
  description: z.string().min(5).max(2000),
  categorie: z.enum(['DON', 'RECHERCHE', 'COVOITURAGE', 'SERVICE', 'PRET', 'EMPLOI', 'AUTRE']).default('AUTRE'),
  prenomAuteur: z.string().min(1).max(50),
  contact: z.string().min(3).max(120),
})

export async function POST(req: NextRequest) {
  try {
    if (!(await moduleActif('annonces'))) {
      return NextResponse.json({ error: 'Module désactivé' }, { status: 403 })
    }
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    // Modération : publiée après validation. Expiration auto à 60 jours.
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    await prisma.annonce.create({ data: { ...parsed.data, statut: 'EN_ATTENTE', expiresAt } })

    return NextResponse.json(
      { message: 'Annonce envoyée — elle sera publiée après validation.' },
      { status: 201 },
    )
  } catch (err) {
    logger.error('[POST /api/annonces]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
