import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminHeader } from '@/components/admin/AdminHeader'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Le middleware protège déjà /admin ; double contrôle ici (defense in depth)
  // et récupération de l'email pour l'en-tête.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login?callbackUrl=/admin')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AdminHeader email={session.user.email} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  )
}
