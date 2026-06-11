import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Connexion' }

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-semibold text-village-700 dark:text-village-400">
            <span aria-hidden="true">🌿</span> Fleurieux
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Connexion</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Espace d’administration du portail.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:underline">← Retour au site</Link>
        </p>
      </div>
    </div>
  )
}
