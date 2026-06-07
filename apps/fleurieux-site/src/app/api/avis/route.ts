// src/app/api/avis/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const avisSchema = z.object({
  acteurId:     z.string().cuid(),
  note:         z.number().int().min(1).max(5),
  texte:        z.string().max(1000).optional(),
  prenomAuteur: z.string().max(50).optional(),
  // SEC-012 : estHabitant retiré du payload client — calculé côté serveur
})

// SEC-001 : rate limiting in-memory par IP (5 soumissions/min)
// Note : fonctionne pour un déploiement single-instance. Passer à Redis en multi-instance.
const avisRateLimit = new Map<string, { count: number; reset: number }>()

// NEW-001 : lire uniquement x-real-ip (positionné par nginx) — x-forwarded-for est forgeable
function getIp(req: NextRequest): string {
  return req.headers.get('x-real-ip') ?? 'unknown'
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  // RES-004 : purge des entrées expirées pour éviter la croissance illimitée de la Map
  for (const [key, entry] of avisRateLimit) {
    if (now > entry.reset) avisRateLimit.delete(key)
  }
  const entry = avisRateLimit.get(ip)
  if (!entry) {
    avisRateLimit.set(ip, { count: 1, reset: now + 60_000 })
    return false
  }
  if (entry.count >= 5) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  try {
    const ip = getIp(req)

    if (isRateLimited(ip)) {
      logger.warn('avis rate limited', { ip })
      return NextResponse.json({ error: 'Trop de soumissions. Réessayez dans une minute.' }, { status: 429 })
    }

    const body = await req.json()
    const data = avisSchema.parse(body)

    const acteur = await prisma.acteur.findUnique({
      where: { id: data.acteurId, statut: 'PUBLIE', avisActives: true },
      select: { id: true }
    })

    if (!acteur) {
      return NextResponse.json({ error: 'Acteur introuvable ou avis désactivés' }, { status: 404 })
    }

    // SEC-012 : estHabitant dérivé de la session, non fourni par le client
    const session = await auth.api.getSession({ headers: req.headers }).catch(() => null)
    const estHabitant = session?.user.role === 'HABITANT'

    const avis = await prisma.avis.create({
      data: {
        acteurId:     data.acteurId,
        note:         data.note,
        texte:        data.texte,
        prenomAuteur: data.prenomAuteur,
        estHabitant,
        statut:       'EN_ATTENTE',
        ...(session && { userId: session.user.id }),
      }
    })

    logger.info('avis soumis', { acteurId: data.acteurId, ip })
    // RES-001 : ne pas retourner l'objet Prisma complet (contient userId, estHabitant...)
    return NextResponse.json(
      { message: 'Avis soumis — il sera publié après validation.', id: avis.id },
      { status: 201 }
    )
  } catch (err) {
    if (err instanceof z.ZodError) {
      // SEC-008 : détails Zod masqués en production
      return NextResponse.json(
        process.env.NODE_ENV === 'development'
          ? { error: 'Données invalides', details: err.errors }
          : { error: 'Données invalides' },
        { status: 400 }
      )
    }
    logger.error('[POST /api/avis]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

const patchSchema = z.object({
  id:     z.string().cuid(),
  action: z.enum(['approuver', 'refuser']),
})

// Modération : approuver / refuser un avis (admin/modérateur)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'MODERATEUR') {
      logger.warn('accès refusé modération avis', { userId: session.user.id, role })
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await req.json()
    const { id, action } = patchSchema.parse(body)

    const existing = await prisma.avis.findUnique({ where: { id }, select: { id: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Avis introuvable' }, { status: 404 })
    }

    const statut = action === 'approuver' ? 'APPROUVE' : 'REFUSE'
    const avis = await prisma.avis.update({ where: { id }, data: { statut } })

    if (statut === 'APPROUVE') {
      const stats = await prisma.avis.aggregate({
        where: { acteurId: avis.acteurId, statut: 'APPROUVE' },
        _avg: { note: true },
        _count: { note: true },
      })
      await prisma.acteur.update({
        where: { id: avis.acteurId },
        data: {
          noteAverage: stats._avg.note ?? 0,
          nbAvis: stats._count.note,
        }
      })
    }

    logger.info('avis modéré', { avisId: id, action, moderateurId: session.user.id })
    // RES-002 : ne pas retourner l'objet Prisma complet
    return NextResponse.json({ message: `Avis ${action === 'approuver' ? 'approuvé' : 'refusé'}`, id: avis.id })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        process.env.NODE_ENV === 'development'
          ? { error: 'Données invalides', details: err.errors }
          : { error: 'Données invalides' },
        { status: 400 }
      )
    }
    logger.error('[PATCH /api/avis]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
