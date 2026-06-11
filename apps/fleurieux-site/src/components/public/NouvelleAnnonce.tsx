'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'

const CATS = [
  ['DON', 'Don'], ['RECHERCHE', 'Recherche'], ['COVOITURAGE', 'Covoiturage'],
  ['SERVICE', 'Service'], ['PRET', 'Prêt'], ['EMPLOI', 'Emploi'], ['AUTRE', 'Autre'],
] as const

const FIELD = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'

const EMPTY = { titre: '', description: '', categorie: 'AUTRE', prenomAuteur: '', contact: '' }

export function NouvelleAnnonce() {
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
      const res = await fetch('/api/annonces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setState('ok'); setMsg(data.message ?? 'Annonce envoyée.'); setForm(EMPTY)
      } else {
        setState('error'); setMsg(data.error ?? 'Une erreur est survenue.')
      }
    } catch {
      setState('error'); setMsg('Une erreur est survenue.')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="an-titre" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Titre</label>
          <input id="an-titre" required maxLength={120} value={form.titre} onChange={e => set('titre', e.target.value)} className={FIELD} placeholder="Donne un canapé, cherche covoiturage…" />
        </div>
        <div>
          <label htmlFor="an-cat" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Catégorie</label>
          <select id="an-cat" value={form.categorie} onChange={e => set('categorie', e.target.value)} className={FIELD}>
            {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="an-desc" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
        <textarea id="an-desc" required maxLength={2000} rows={4} value={form.description} onChange={e => set('description', e.target.value)} className={FIELD} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="an-prenom" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Prénom</label>
          <input id="an-prenom" required maxLength={50} value={form.prenomAuteur} onChange={e => set('prenomAuteur', e.target.value)} className={FIELD} />
        </div>
        <div>
          <label htmlFor="an-contact" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Contact (e-mail ou téléphone)</label>
          <input id="an-contact" required maxLength={120} value={form.contact} onChange={e => set('contact', e.target.value)} className={FIELD} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={state === 'loading'}>
          {state === 'loading' ? 'Envoi…' : 'Publier l’annonce'}
        </Button>
        {msg && (
          <p role="status" className={`text-sm ${state === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{msg}</p>
        )}
      </div>
      <p className="text-xs text-gray-400">Votre annonce sera publiée après une rapide validation.</p>
    </form>
  )
}
