'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

// Évite l'open redirect : on n'accepte qu'un chemin interne (commence par "/" mais pas "//").
function safeCallback(raw: string | null): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw
  return '/admin'
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = safeCallback(searchParams.get('callbackUrl'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data, error } = await signIn.email({
        email,
        password,
        callbackURL: callbackUrl,
      })
      if (error) {
        // Message générique : pas d'énumération de comptes.
        setError(error.message ?? 'Identifiants invalides.')
        setLoading(false)
        return
      }
      // 2FA activée : le plugin renvoie twoFactorRedirect → page de vérification.
      if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) {
        router.push('/login/two-factor')
        return
      }
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Erreur de connexion. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Connexion</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Espace d&apos;administration</p>
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Connexion…' : 'Se connecter'}
        </Button>
      </form>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
