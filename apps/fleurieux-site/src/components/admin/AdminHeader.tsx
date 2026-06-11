'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'

export function AdminHeader({ email }: { email: string }) {
  const router = useRouter()

  async function handleSignOut() {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/admin" className="text-gray-900 hover:text-village-600 dark:text-gray-100">Dashboard</Link>
          <Link href="/admin/securite" className="text-gray-600 hover:text-village-600 dark:text-gray-400">Sécurité</Link>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-gray-500 dark:text-gray-400 sm:inline">{email}</span>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  )
}
