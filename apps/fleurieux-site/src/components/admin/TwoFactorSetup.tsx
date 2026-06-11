'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { twoFactor } from '@/lib/auth-client'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

type Phase = 'idle' | 'enabling' | 'verifying' | 'disabling'

export function TwoFactorSetup({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [phase, setPhase] = useState<Phase>('idle')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [totpUri, setTotpUri] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!totpUri) { setQrDataUrl(null); return }
    QRCode.toDataURL(totpUri, { margin: 1, width: 220 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null))
  }, [totpUri])

  function resetFlow() {
    setPhase('idle'); setPassword(''); setCode(''); setTotpUri(null)
    setBackupCodes([]); setError(null); setLoading(false)
  }

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const { data, error } = await twoFactor.enable({ password })
      if (error || !data) {
        // 401/400 = mauvais mot de passe ; autre code = erreur serveur réelle.
        const msg = error?.status === 401 || error?.status === 400
          ? 'Mot de passe incorrect.'
          : error?.message || 'Échec de l\'activation de la 2FA. Réessayez.'
        setError(msg)
        setLoading(false)
        return
      }
      setTotpUri(data.totpURI)
      setBackupCodes(data.backupCodes ?? [])
      setPhase('verifying')
      setPassword('')
    } catch {
      setError('Erreur lors de l\'activation.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const { error } = await twoFactor.verifyTotp({ code: code.trim() })
      if (error) {
        setError('Code invalide. Vérifiez l\'horloge de votre téléphone.')
        setLoading(false)
        return
      }
      setEnabled(true)
      setTotpUri(null)
      setCode(''); setPhase('idle')
    } catch {
      setError('Erreur de vérification.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setLoading(true)
    try {
      const { error } = await twoFactor.disable({ password })
      if (error) {
        setError(error.message ?? 'Mot de passe incorrect.')
        setLoading(false)
        return
      }
      setEnabled(false)
      resetFlow()
    } catch {
      setError('Erreur lors de la désactivation.')
      setLoading(false)
    }
  }

  // ── 2FA active ───────────────────────────────────────────
  if (enabled && phase !== 'disabling') {
    return (
      <Card>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            <p className="font-medium text-gray-900 dark:text-gray-100">
              Authentification à deux facteurs activée
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Un code de votre application d&apos;authentification est demandé à chaque connexion.
          </p>
          <Button variant="danger" onClick={() => setPhase('disabling')}>Désactiver la 2FA</Button>
        </div>
      </Card>
    )
  }

  // ── Désactivation ────────────────────────────────────────
  if (phase === 'disabling') {
    return (
      <Card>
        <form onSubmit={handleDisable} className="space-y-3">
          <p className="font-medium text-gray-900 dark:text-gray-100">Désactiver la 2FA</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Confirmez avec votre mot de passe.</p>
          <input
            type="password"
            autoComplete="current-password"
            required
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" variant="danger" disabled={loading}>{loading ? '…' : 'Confirmer'}</Button>
            <Button type="button" variant="secondary" onClick={resetFlow}>Annuler</Button>
          </div>
        </form>
      </Card>
    )
  }

  // ── Étape vérification (QR + codes de secours) ───────────
  if (phase === 'verifying') {
    return (
      <Card>
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="font-medium text-gray-900 dark:text-gray-100">1. Scannez ce QR code</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Avec Google Authenticator, Authy, ou tout autre client TOTP.
          </p>
          {qrDataUrl
            ? <img src={qrDataUrl} alt="QR code TOTP" width={220} height={220} className="rounded-lg border border-gray-200 dark:border-gray-700" />
            : <p className="text-sm text-gray-400">Génération du QR…</p>}

          {totpUri && (
            <details className="text-sm">
              <summary className="cursor-pointer text-village-600 dark:text-village-400">Saisie manuelle (clé secrète)</summary>
              <code className="mt-1 block break-all rounded bg-gray-100 p-2 text-xs dark:bg-gray-800">{totpUri}</code>
            </details>
          )}

          {backupCodes.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-900/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                2. Conservez vos codes de secours
              </p>
              <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">
                Chaque code n&apos;est utilisable qu&apos;une fois. Stockez-les hors ligne.
              </p>
              <ul className="grid grid-cols-2 gap-1 font-mono text-xs text-amber-900 dark:text-amber-200">
                {backupCodes.map(c => <li key={c}>{c}</li>)}
              </ul>
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="verify-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              3. Entrez le code à 6 chiffres pour confirmer
            </label>
            <input
              id="verify-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={e => setCode(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-center text-lg tracking-widest dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? 'Vérification…' : 'Activer'}</Button>
            <Button type="button" variant="secondary" onClick={resetFlow}>Annuler</Button>
          </div>
        </form>
      </Card>
    )
  }

  // ── État initial : proposer l'activation ─────────────────
  return (
    <Card>
      <form onSubmit={handleEnable} className="space-y-3">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          Authentification à deux facteurs désactivée
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Ajoutez une couche de sécurité : un code temporaire sera demandé à chaque connexion.
          Confirmez avec votre mot de passe pour commencer.
        </p>
        <input
          type="password"
          autoComplete="current-password"
          required
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        />
        {error && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? '…' : 'Activer la 2FA'}</Button>
      </form>
    </Card>
  )
}
