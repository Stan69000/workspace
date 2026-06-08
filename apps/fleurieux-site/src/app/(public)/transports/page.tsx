import { getTransportsData } from '@/lib/transports'
import { TransportsPage } from '@/components/public/TransportsPage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Transports' }
export const revalidate = 120

export default async function Page() {
  let initial = null
  try {
    initial = await getTransportsData()
  } catch {
    // Le composant client gère l'erreur
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Transports</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Ligne Lyon Saint-Paul — L&apos;Arbresle — Sain-Bel (TER)
        </p>
      </div>
      <TransportsPage initial={initial} />
    </div>
  )
}
