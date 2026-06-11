'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { twoFactor } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function TwoFactorPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [mode, setMode] = useState<'totp' | 'backup'>('totp')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = mode === 'totp'
        ? await twoFactor.verifyTotp({ code: code.trim() })
        : await twoFactor.verifyBackupCode({ code: code.trim() })

      if (error) {
        setError(mode === 'totp' ? 'Code invalide ou expiré.' : 'Code de secours invalide.')
        setLoading(false)
        return
      }
      router.push('/admin')
      router.refresh()
    } catch {
      setError('Erreur de vérification. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Vérification en deux étapes</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {mode === 'totp'
                ? "Saisissez le code à 6 chiffres de votre application d'authentification."
                : 'Saisissez l\'un de vos codes de secours.'}
            </p>
          </div>

          <div className="space-y-1">
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {mode === 'totp' ? 'Code TOTP' : 'Code de secours'}
            </label>
            <input
              id="code"
              inputMode={mode === 'totp' ? 'numeric' : 'text'}
              autoComplete="one-time-code"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-widest focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Vérification…' : 'Vérifier'}
          </Button>

          <button
            type="button"
            onClick={() => { setMode(mode === 'totp' ? 'backup' : 'totp'); setCode(''); setError(null) }}
            className="w-full text-center text-sm text-village-600 hover:underline dark:text-village-400"
          >
            {mode === 'totp' ? 'Utiliser un code de secours' : 'Utiliser un code TOTP'}
          </button>
        </form>
      </Card>
    </div>
  )
}
