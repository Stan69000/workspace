import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/push'
import { cronAuthorized } from '@/lib/cron'
import { logger } from '@/lib/logger'

// Récap hebdo des événements à venir, en push (abonnés « AGENDA »).
// À appeler une fois par semaine (ex. lundi 9h) :
//   0 9 * * 1 curl -s -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/recap-hebdo
export async function GET(req: NextRequest) {
  try {
    const { ok, configured } = cronAuthorized(req)
    if (!configured) return NextResponse.json({ error: 'Cron non configuré (CRON_SECRET manquant)' }, { status: 503 })
    if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const now = new Date()
    const fin = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const events = await prisma.evenement.findMany({
      where: { statut: 'PUBLIE', dateDebut: { gte: now, lte: fin } },
      orderBy: { dateDebut: 'asc' },
      take: 6,
      select: { titre: true },
    })
    if (events.length === 0) return NextResponse.json({ events: 0, sent: 0 })

    const titres = events.slice(0, 4).map(e => e.titre).join(', ')
    const body = events.length === 1
      ? events[0].titre
      : `${events.length} événements : ${titres}${events.length > 4 ? '…' : ''}`

    const subs = await prisma.pushSubscription.findMany({ where: { topics: { has: 'AGENDA' } } })
    const results = await Promise.allSettled(
      subs.map(s => sendPushNotification(s, {
        title: 'Cette semaine à Fleurieux',
        body: body.slice(0, 280),
        url: '/agenda',
      })),
    )
    const sent = results.filter(r => r.status === 'fulfilled' && r.value).length

    logger.info('récap hebdo', { events: events.length, sent })
    return NextResponse.json({ events: events.length, sent })
  } catch (err) {
    logger.error('[GET /api/cron/recap-hebdo]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
