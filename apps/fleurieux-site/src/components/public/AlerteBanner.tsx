import Link from 'next/link'
import { prisma } from '@/lib/prisma'

const NIVEAU_STYLE: Record<string, string> = {
  INFO:      'border-blue-300 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
  IMPORTANT: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
  URGENT:    'border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200',
}

const NIVEAU_LABEL: Record<string, string> = { INFO: 'Info', IMPORTANT: 'Important', URGENT: 'Urgent' }

export async function AlerteBanner({ limit = 3 }: { limit?: number }) {
  const now = new Date()
  const alertes = await prisma.alerte.findMany({
    where: {
      actif: true,
      dateDebut: { lte: now },
      OR: [{ dateFin: null }, { dateFin: { gte: now } }],
    },
    orderBy: [{ niveau: 'desc' }, { dateDebut: 'desc' }],
    take: limit,
  })

  if (alertes.length === 0) return null

  return (
    <div role="region" aria-label="Alertes en cours" className="space-y-2">
      {alertes.map(a => (
        <Link
          key={a.id}
          href="/infos-pratiques"
          className={`block rounded-lg border px-4 py-3 transition-opacity hover:opacity-90 ${NIVEAU_STYLE[a.niveau] ?? NIVEAU_STYLE.INFO}`}
        >
          <p className="flex items-center gap-2 text-sm font-semibold">
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-xs uppercase tracking-wide dark:bg-black/20">
              {NIVEAU_LABEL[a.niveau] ?? 'Info'}
            </span>
            {a.titre}
          </p>
          <p className="mt-0.5 text-sm">{a.message}</p>
        </Link>
      ))}
    </div>
  )
}
