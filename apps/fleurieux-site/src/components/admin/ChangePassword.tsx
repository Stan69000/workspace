'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function ChangePassword() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (next !== confirm) {
      setError('Les deux nouveaux mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      // revokeOtherSessions : déconnecte les autres appareils après changement.
      // La politique MDP (longueur min + dictionnaire de fuites) est appliquée
      // côté serveur par le hook Better Auth sur /change-password.
      const { error } = await authClient.changePassword({
        currentPassword: current,
        newPassword: next,
        revokeOtherSessions: true,
      })
      if (error) {
        setError(error.message ?? 'Mot de passe actuel incorrect ou nouveau mot de passe refusé.')
        setLoading(false)
        return
      }
      setSuccess(true)
      setCurrent(''); setNext(''); setConfirm('')
    } catch {
      setError('Erreur lors du changement de mot de passe.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="font-medium text-gray-900 dark:text-gray-100">Mot de passe</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Au moins 12 caractères. Les mots de passe figurant dans une fuite connue sont refusés.
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="cp-current" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mot de passe actuel</label>
          <input
            id="cp-current"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={e => setCurrent(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="cp-new" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nouveau mot de passe</label>
          <input
            id="cp-new"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={next}
            onChange={e => setNext(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="cp-confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmer le nouveau mot de passe</label>
          <input
            id="cp-confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={12}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {success && <p role="status" className="text-sm text-green-600 dark:text-green-400">Mot de passe modifié. Les autres sessions ont été déconnectées.</p>}

        <Button type="submit" disabled={loading}>
          {loading ? 'Modification…' : 'Changer le mot de passe'}
        </Button>
      </form>
    </Card>
  )
}
