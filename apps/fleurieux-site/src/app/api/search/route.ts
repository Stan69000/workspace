import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { searchAll } from '@/lib/search'
import { logger } from '@/lib/logger'

const querySchema = z.object({
  q: z.string().min(1).max(100),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse({ q: searchParams.get('q') })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètre q requis (1–100 caractères)' }, { status: 400 })
    }

    const results = await searchAll(parsed.data.q)
    return NextResponse.json(results)
  } catch (err) {
    logger.error('[GET /api/search]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
