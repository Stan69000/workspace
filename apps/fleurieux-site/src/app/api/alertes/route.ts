import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendPushNotification } from '@/lib/push'
import { logger } from '@/lib/logger'

const schema = z.object({
  titre: z.string().min(1).max(120),
  message: z.string().min(1).max(1000),
  type: z.enum(['TRAVAUX', 'EAU', 'ELECTRICITE', 'METEO', 'CHASSE', 'SECURITE', 'ROUTE', 'AUTRE']).default('AUTRE'),
  niveau: z.enum(['INFO', 'IMPORTANT', 'URGENT']).default('INFO'),
  dateFin: z.string().datetime().optional(),
  push: z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session || !['ADMIN', 'MODERATEUR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const { push, dateFin, ...data } = parsed.data
    const alerte = await prisma.alerte.create({
      data: { ...data, dateFin: dateFin ? new Date(dateFin) : null },
    })

    let sent = 0
    if (push) {
      const subs = await prisma.pushSubscription.findMany({ where: { topics: { has: 'ALERTES' } } })
      const results = await Promise.allSettled(
        subs.map(s => sendPushNotification(s, {
          title: data.niveau === 'URGENT' ? `Alerte : ${data.titre}` : data.titre,
          body: data.message.slice(0, 180),
          url: '/infos-pratiques',
        })),
      )
      sent = results.filter(r => r.status === 'fulfilled' && r.value).length
    }

    logger.info('alerte créée', { id: alerte.id, push: sent, userId: session.user.id })
    return NextResponse.json({ id: alerte.id, pushEnvoyes: sent }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/alertes]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
