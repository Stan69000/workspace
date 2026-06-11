'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

const TYPES = [
  ['ECLAIRAGE', 'Éclairage public'], ['VOIRIE', 'Voirie / chaussée'], ['PROPRETE', 'Propreté / dépôt sauvage'],
  ['ESPACES_VERTS', 'Espaces verts'], ['MOBILIER', 'Mobilier urbain'], ['AUTRE', 'Autre'],
] as const

const FIELD = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'

const EMPTY = { type: 'AUTRE', description: '', localisation: '', prenomAuteur: '', contact: '' }

export function SignalementForm() {
  const [form, setForm] = useState(EMPTY)
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  function set<K extends keyof typeof EMPTY>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading'); setMsg('')
    try {
      const res = await fetch('/api/signalements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) { setState('ok'); setMsg(data.message ?? 'Signalement transmis.'); setForm(EMPTY) }
      else { setState('error'); setMsg(data.error ?? 'Une erreur est survenue.') }
    } catch {
      setState('error'); setMsg('Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="sg-type" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type de problème</label>
        <select id="sg-type" value={form.type} onChange={e => set('type', e.target.value)} className={FIELD}>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="sg-desc" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea id="sg-desc" required maxLength={1000} rows={4} value={form.description} onChange={e => set('description', e.target.value)} className={FIELD} placeholder="Décrivez le problème constaté." />
      </div>
      <div>
        <label htmlFor="sg-loc" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Localisation (rue, lieu-dit)</label>
        <input id="sg-loc" maxLength={200} value={form.localisation} onChange={e => set('localisation', e.target.value)} className={FIELD} placeholder="Ex. : Place Benoît Dubost" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="sg-prenom" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom (facultatif)</label>
          <input id="sg-prenom" maxLength={50} value={form.prenomAuteur} onChange={e => set('prenomAuteur', e.target.value)} className={FIELD} />
        </div>
        <div>
          <label htmlFor="sg-contact" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact (facultatif)</label>
          <input id="sg-contact" maxLength={120} value={form.contact} onChange={e => set('contact', e.target.value)} className={FIELD} placeholder="Pour un retour de la mairie" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={state === 'loading'}>{state === 'loading' ? 'Envoi…' : 'Envoyer le signalement'}</Button>
        {msg && <p role="status" className={`text-sm ${state === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{msg}</p>}
      </div>
    </form>
  )
}
