'use client'
import dynamic from 'next/dynamic'

export const ActeursMapClient = dynamic(
  () => import('@/components/public/ActeursMap').then(m => m.ActeursMap),
  {
    ssr: false,
    loading: () => <div className="h-[420px] w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />,
  }
)
