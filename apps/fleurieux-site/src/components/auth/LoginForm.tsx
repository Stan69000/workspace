'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'

const FIELD = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const raw = params.get('callbackUrl') || '/admin'
  // Sécurité : on n'accepte qu'un chemin relatif interne
  const callbackUrl = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signIn.email({ email, password })
    if (error) {
      setError(error.message || 'E-mail ou mot de passe incorrect.')
      setLoading(false)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className={FIELD} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe</label>
        <input id="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className={FIELD} />
      </div>
      {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Connexion…' : 'Se connecter'}
      </Button>
    </form>
  )
}
