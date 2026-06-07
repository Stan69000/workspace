'use client'
import dynamic from 'next/dynamic'

export const RandoChartClient = dynamic(
  () => import('@/components/public/RandoChart').then(m => m.RandoChart),
  { ssr: false, loading: () => <div className="h-[200px] w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" /> }
)
