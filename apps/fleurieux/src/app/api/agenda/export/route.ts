import { NextRequest, NextResponse } from 'next/server'
import ical from 'ical-generator'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const categorie = searchParams.get('categorie')

    const evenements = await prisma.evenement.findMany({
      where: {
        statut: 'PUBLIE',
        ...(categorie && { categorie }),
      },
      orderBy: { dateDebut: 'asc' },
      take: 200,
    })

    const calendar = ical({ name: 'Agenda Fleurieux-sur-l\'Arbresle', timezone: 'Europe/Paris' })

    for (const evt of evenements) {
      calendar.createEvent({
        id: evt.id,
        start: evt.dateDebut,
        end: evt.dateFin ?? new Date(evt.dateDebut.getTime() + 2 * 60 * 60 * 1000),
        summary: evt.titre,
        description: evt.description ?? undefined,
        location: evt.lieu ?? undefined,
        url: evt.lienInscription ?? undefined,
      })
    }

    return new NextResponse(calendar.toString(), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="agenda-fleurieux.ics"',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch (err) {
    logger.error('[GET /api/agenda/export]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
