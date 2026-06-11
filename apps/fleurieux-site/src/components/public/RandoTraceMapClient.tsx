'use client'
import dynamic from 'next/dynamic'

// Leaflet a besoin de window → chargé côté client uniquement.
export const RandoTraceMapClient = dynamic(
  () => import('./RandoTraceMap').then(m => m.RandoTraceMap),
  {
    ssr: false,
    loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />,
  },
)
