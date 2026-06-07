import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = subscribeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const session = await auth.api.getSession({ headers: req.headers }).catch(() => null)

    await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.data.endpoint },
      update: {
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
        userId: session?.user.id ?? null,
      },
      create: {
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
        userId: session?.user.id ?? null,
      },
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    logger.error('[POST /api/push/subscribe]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const endpoint = z.string().url().safeParse(body?.endpoint)
    if (!endpoint.success) {
      return NextResponse.json({ error: 'endpoint invalide' }, { status: 400 })
    }

    await prisma.pushSubscription.deleteMany({ where: { endpoint: endpoint.data } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error('[DELETE /api/push/subscribe]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
