import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendPushNotification } from '@/lib/push'
import { collecteLeJour, TYPE_DECHET_LABEL } from '@/lib/collecte'
import { cronAuthorized } from '@/lib/cron'
import { logger } from '@/lib/logger'

// Rappel collecte de la veille. À appeler chaque jour vers 18h via un cron :
//   0 18 * * * curl -s -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/cron/collecte-rappel
export async function GET(req: NextRequest) {
  try {
    const { ok, configured } = cronAuthorized(req)
    if (!configured) return NextResponse.json({ error: 'Cron non configuré (CRON_SECRET manquant)' }, { status: 503 })
    if (!ok) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const collectes = await prisma.collecteDechets.findMany({ where: { actif: true } })
    const demain = collectes.filter(c => collecteLeJour(c, tomorrow))
    if (demain.length === 0) return NextResponse.json({ collectes: 0, sent: 0 })

    const labels = demain.map(c => TYPE_DECHET_LABEL[c.type] ?? c.type).join(' et ')
    const subs = await prisma.pushSubscription.findMany({ where: { topics: { has: 'DECHETS' } } })
    const results = await Promise.allSettled(
      subs.map(s => sendPushNotification(s, {
        title: 'Collecte des déchets demain',
        body: `Pensez à sortir : ${labels}.`,
        url: '/infos-pratiques',
      })),
    )
    const sent = results.filter(r => r.status === 'fulfilled' && r.value).length

    logger.info('rappel collecte', { collectes: demain.length, labels, sent })
    return NextResponse.json({ collectes: demain.length, labels, sent })
  } catch (err) {
    logger.error('[GET /api/cron/collecte-rappel]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
