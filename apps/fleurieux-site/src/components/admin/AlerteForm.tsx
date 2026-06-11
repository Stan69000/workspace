'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const TYPES = [
  ['TRAVAUX', 'Travaux'], ['EAU', 'Eau'], ['ELECTRICITE', 'Électricité'], ['METEO', 'Météo'],
  ['CHASSE', 'Chasse'], ['SECURITE', 'Sécurité'], ['ROUTE', 'Route'], ['AUTRE', 'Autre'],
] as const
const NIVEAUX = [['INFO', 'Info'], ['IMPORTANT', 'Important'], ['URGENT', 'Urgent']] as const

const FIELD = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'

const EMPTY = { titre: '', message: '', type: 'AUTRE', niveau: 'INFO', push: true }

export function AlerteForm() {
  const router = useRouter()
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  function set<K extends keyof typeof EMPTY>(k: K, v: typeof EMPTY[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading'); setMsg('')
    try {
      const res = await fetch('/api/alertes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setState('ok')
        setMsg(form.push ? `Publiée — ${data.pushEnvoyes ?? 0} notification(s) envoyée(s).` : 'Alerte publiée.')
        setForm(EMPTY)
        router.refresh()
      } else {
        setState('error'); setMsg(data.error ?? 'Erreur.')
      }
    } catch {
      setState('error'); setMsg('Erreur.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="al-titre" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
        <input id="al-titre" required maxLength={120} value={form.titre} onChange={e => set('titre', e.target.value)} className={FIELD} placeholder="Coupure d'eau, route barrée…" />
      </div>
      <div>
        <label htmlFor="al-msg" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
        <textarea id="al-msg" required maxLength={1000} rows={3} value={form.message} onChange={e => set('message', e.target.value)} className={FIELD} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="al-type" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <select id="al-type" value={form.type} onChange={e => set('type', e.target.value)} className={FIELD}>
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="al-niveau" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Niveau</label>
          <select id="al-niveau" value={form.niveau} onChange={e => set('niveau', e.target.value)} className={FIELD}>
            {NIVEAUX.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <input type="checkbox" checked={form.push} onChange={e => set('push', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
        Notifier les abonnés (push)
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Publication…' : 'Publier l’alerte'}</Button>
        {msg && <p role="status" className={`text-sm ${state === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{msg}</p>}
      </div>
    </form>
  )
}
