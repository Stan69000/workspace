'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const TYPES = [
  ['ORDURES_MENAGERES', 'Ordures ménagères'], ['TRI_SELECTIF', 'Tri sélectif'],
  ['VERRE', 'Verre'], ['DECHETS_VERTS', 'Déchets verts'], ['ENCOMBRANTS', 'Encombrants'],
] as const
const JOURS = [
  ['LUNDI', 'Lundi'], ['MARDI', 'Mardi'], ['MERCREDI', 'Mercredi'], ['JEUDI', 'Jeudi'],
  ['VENDREDI', 'Vendredi'], ['SAMEDI', 'Samedi'], ['DIMANCHE', 'Dimanche'],
] as const
const FREQ = [
  ['HEBDOMADAIRE', 'Chaque semaine'], ['SEMAINES_PAIRES', 'Semaines paires'], ['SEMAINES_IMPAIRES', 'Semaines impaires'],
] as const

const FIELD = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-village-500 focus:outline-none focus:ring-1 focus:ring-village-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100'
const EMPTY = { type: 'ORDURES_MENAGERES', jour: 'MARDI', frequence: 'HEBDOMADAIRE', note: '' }

export function CollecteForm() {
  const router = useRouter()
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)

  function set<K extends keyof typeof EMPTY>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await fetch('/api/collectes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setForm(EMPTY); router.refresh() }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-3 sm:grid-cols-4">
      <div>
        <label htmlFor="co-type" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
        <select id="co-type" value={form.type} onChange={e => set('type', e.target.value)} className={FIELD}>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="co-jour" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Jour</label>
        <select id="co-jour" value={form.jour} onChange={e => set('jour', e.target.value)} className={FIELD}>
          {JOURS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="co-freq" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Fréquence</label>
        <select id="co-freq" value={form.frequence} onChange={e => set('frequence', e.target.value)} className={FIELD}>
          {FREQ.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="flex items-end">
        <Button type="submit" disabled={busy} className="w-full">{busy ? '…' : 'Ajouter'}</Button>
      </div>
    </form>
  )
}
