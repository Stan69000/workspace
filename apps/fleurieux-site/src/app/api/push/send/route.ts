import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendPushNotification } from '@/lib/push'
import { logger } from '@/lib/logger'

const sendSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(300),
  url: z.string().url().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = sendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const subscriptions = await prisma.pushSubscription.findMany()
    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        sendPushNotification(sub, { title: parsed.data.title, body: parsed.data.body, url: parsed.data.url })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled' && r.value).length
    logger.info('push envoyé', { total: subscriptions.length, sent, userId: session.user.id })

    return NextResponse.json({ total: subscriptions.length, sent })
  } catch (err) {
    logger.error('[POST /api/push/send]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
