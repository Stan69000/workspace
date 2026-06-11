import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Lit les sujets choisis pour un abonnement (par endpoint).
export async function GET(req: NextRequest) {
  try {
    const endpoint = new URL(req.url).searchParams.get('endpoint')
    if (!endpoint) return NextResponse.json({ error: 'endpoint requis' }, { status: 400 })
    const sub = await prisma.pushSubscription.findUnique({ where: { endpoint }, select: { topics: true } })
    if (!sub) return NextResponse.json({ subscribed: false, topics: [] })
    return NextResponse.json({ subscribed: true, topics: sub.topics })
  } catch (err) {
    logger.error('[GET /api/push/preferences]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
