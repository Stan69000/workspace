import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SignalementForm } from '@/components/public/SignalementForm'
import { moduleActif } from '@/lib/modules'

export const metadata: Metadata = { title: 'Signaler un problème' }

export default async function SignalerPage() {
  if (!(await moduleActif('signalement'))) notFound()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Signaler un problème</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Éclairage en panne, dépôt sauvage, nid-de-poule… votre signalement est transmis à la mairie.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 p-5 dark:border-gray-800">
        <SignalementForm />
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Pour une urgence, contactez directement la mairie au{' '}
        <a href="tel:0474012601" className="text-village-600 hover:underline">04 74 01 26 01</a> ou consultez les{' '}
        <Link href="/infos-pratiques" className="text-village-600 hover:underline">infos pratiques</Link>.
      </p>
    </div>
  )
}
