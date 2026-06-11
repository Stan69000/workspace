import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { geocodeAdresse } from '@/lib/geocode'
import { logger } from '@/lib/logger'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const acteur = await prisma.acteur.findUnique({
      where: { slug, statut: 'PUBLIE' },
      include: {
        categorie: true,
        horaires: { orderBy: { jour: 'asc' } },
        photos: { orderBy: { ordre: 'asc' } },
      },
    })

    if (!acteur) {
      return NextResponse.json({ error: 'Acteur introuvable' }, { status: 404 })
    }

    // Géocode automatiquement si lat/lng manquants
    if (!acteur.latitude && !acteur.longitude && acteur.adresse) {
      const coords = await geocodeAdresse(acteur.adresse, acteur.codePostal ?? undefined, acteur.ville ?? undefined)
      if (coords) {
        await prisma.acteur.update({
          where: { id: acteur.id },
          data: { latitude: coords.lat, longitude: coords.lon },
        })
        acteur.latitude  = coords.lat
        acteur.longitude = coords.lon
      }
    }

    return NextResponse.json(acteur)
  } catch (err) {
    logger.error('[GET /api/acteurs/[slug]]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
