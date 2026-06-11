'use client'
import dynamic from 'next/dynamic'

export const MeteoChartClient = dynamic(
  () => import('@/components/public/MeteoChart').then(m => m.MeteoChart),
  { ssr: false, loading: () => <div className="h-[220px] w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" /> },
)
