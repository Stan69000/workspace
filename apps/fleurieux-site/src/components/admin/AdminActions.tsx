'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

function useMutate() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  async function run(url: string, method: string, body?: unknown) {
    setBusy(true)
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (res.ok) router.refresh()
    } finally {
      setBusy(false)
    }
  }
  return { busy, run }
}

const BTN = 'rounded-md px-2.5 py-1 text-xs font-medium disabled:opacity-50'

export function AlerteActions({ id, actif }: { id: string; actif: boolean }) {
  const { busy, run } = useMutate()
  return (
    <div className="flex gap-2">
      <button disabled={busy} onClick={() => run(`/api/alertes/${id}`, 'PATCH', { actif: !actif })}
        className={`${BTN} border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800`}>
        {actif ? 'Désactiver' : 'Réactiver'}
      </button>
      <button disabled={busy} onClick={() => { if (confirm('Supprimer cette alerte ?')) run(`/api/alertes/${id}`, 'DELETE') }}
        className={`${BTN} text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30`}>
        Supprimer
      </button>
    </div>
  )
}

export function AnnonceActions({ id, statut }: { id: string; statut: string }) {
  const { busy, run } = useMutate()
  return (
    <div className="flex gap-2">
      {statut !== 'PUBLIE' && (
        <button disabled={busy} onClick={() => run(`/api/annonces/${id}`, 'PATCH', { statut: 'PUBLIE' })}
          className={`${BTN} bg-green-600 text-white hover:bg-green-700`}>Valider</button>
      )}
      {statut === 'PUBLIE' ? (
        <button disabled={busy} onClick={() => run(`/api/annonces/${id}`, 'PATCH', { statut: 'ARCHIVE' })}
          className={`${BTN} border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800`}>Dépublier</button>
      ) : (
        <button disabled={busy} onClick={() => run(`/api/annonces/${id}`, 'PATCH', { statut: 'ARCHIVE' })}
          className={`${BTN} text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30`}>Refuser</button>
      )}
      <button disabled={busy} onClick={() => { if (confirm('Supprimer définitivement ?')) run(`/api/annonces/${id}`, 'DELETE') }}
        className={`${BTN} text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30`}>Supprimer</button>
    </div>
  )
}

export function ModuleToggle({ moduleKey, actif }: { moduleKey: string; actif: boolean }) {
  const { busy, run } = useMutate()
  return (
    <button
      type="button"
      role="switch"
      aria-checked={actif}
      disabled={busy}
      onClick={() => run(`/api/modules/${moduleKey}`, 'PATCH', { actif: !actif })}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${actif ? 'bg-village-600' : 'bg-gray-300 dark:bg-gray-700'}`}
    >
      <span className="sr-only">{actif ? 'Activé' : 'Désactivé'}</span>
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${actif ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  )
}

export function CollecteActions({ id, actif }: { id: string; actif: boolean }) {
  const { busy, run } = useMutate()
  return (
    <div className="flex gap-2">
      <button disabled={busy} onClick={() => run(`/api/collectes/${id}`, 'PATCH', { actif: !actif })}
        className={`${BTN} border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800`}>
        {actif ? 'Désactiver' : 'Réactiver'}
      </button>
      <button disabled={busy} onClick={() => { if (confirm('Supprimer cette collecte ?')) run(`/api/collectes/${id}`, 'DELETE') }}
        className={`${BTN} text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30`}>
        Supprimer
      </button>
    </div>
  )
}

const SIG_STATUTS = [['NOUVEAU', 'Nouveau'], ['EN_COURS', 'En cours'], ['RESOLU', 'Résolu'], ['REFUSE', 'Refusé']] as const

export function SignalementStatus({ id, statut }: { id: string; statut: string }) {
  const { busy, run } = useMutate()
  return (
    <div className="flex items-center gap-2">
      <select
        disabled={busy}
        value={statut}
        onChange={e => run(`/api/signalements/${id}`, 'PATCH', { statut: e.target.value })}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
      >
        {SIG_STATUTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <button disabled={busy} onClick={() => { if (confirm('Supprimer ce signalement ?')) run(`/api/signalements/${id}`, 'DELETE') }}
        className={`${BTN} text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30`}>Supprimer</button>
    </div>
  )
}
