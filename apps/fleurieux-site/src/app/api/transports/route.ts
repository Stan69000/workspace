import { NextResponse } from 'next/server'
import { getTransportsData } from '@/lib/transports'

export const runtime = 'nodejs'
export const revalidate = 120

export async function GET() {
  try {
    const data = await getTransportsData()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=60' },
    })
  } catch (err) {
    console.error('transports API error', err)
    return NextResponse.json({ error: 'Impossible de récupérer les données transport' }, { status: 503 })
  }
}
