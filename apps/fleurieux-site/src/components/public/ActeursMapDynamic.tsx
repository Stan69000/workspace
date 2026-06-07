'use client'
import dynamic from 'next/dynamic'

export const ActeursMapDynamic = dynamic(
  () => import('./ActeursMap').then(m => m.ActeursMap),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        aria-label="Chargement de la carte"
        aria-busy="true"
        className="h-[420px] w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800"
      >
        <span className="sr-only">Chargement de la carte en cours…</span>
      </div>
    ),
  },
)
