import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TwoFactorSetup } from '@/components/admin/TwoFactorSetup'

export const metadata: Metadata = { title: 'Sécurité' }
export const dynamic = 'force-dynamic'

export default async function SecuritePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login?callbackUrl=/admin/securite')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true },
  })

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sécurité</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Authentification à deux facteurs de votre compte.
        </p>
      </div>
      <TwoFactorSetup initialEnabled={user?.twoFactorEnabled ?? false} />
    </div>
  )
}
