'use client'
import { useState } from 'react'

interface Props {
  acteurId: string
  acteurNom: string
}

const ETOILES = [1, 2, 3, 4, 5]

export function FormulaireAvis({ acteurId, acteurNom }: Props) {
  const [note, setNote] = useState(0)
  const [hover, setHover] = useState(0)
  const [texte, setTexte] = useState('')
  const [prenom, setPrenom] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [erreur, setErreur] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!note) { setErreur('Veuillez sélectionner une note.'); return }
    setStatus('loading')
    setErreur('')
    try {
      const res = await fetch('/api/avis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acteurId, note, texte: texte || undefined, prenomAuteur: prenom || undefined }),
      })
      if (res.ok) {
        setStatus('ok')
      } else {
        const data = await res.json()
        setErreur(data.error ?? 'Erreur lors de la soumission.')
        setStatus('error')
      }
    } catch {
      setErreur('Erreur réseau.')
      setStatus('error')
    }
  }

  if (status === 'ok') {
    return (
      <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
        Merci ! Votre avis sera publié après validation.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label={`Laisser un avis pour ${acteurNom}`}>
      {/* Étoiles */}
      <fieldset>
        <legend className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          Note <span aria-hidden="true">*</span><span className="sr-only">(obligatoire)</span>
        </legend>
        <div className="flex gap-1" role="group">
          {ETOILES.map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setNote(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
              aria-pressed={note >= n}
              className="text-2xl leading-none transition-transform hover:scale-110"
            >
              <span aria-hidden="true" className={(hover || note) >= n ? 'text-amber-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      {/* Prénom */}
      <div>
        <label htmlFor="avis-prenom" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Prénom <span className="text-gray-400">(optionnel)</span>
        </label>
        <input
          id="avis-prenom"
          type="text"
          value={prenom}
          onChange={e => setPrenom(e.target.value)}
          maxLength={50}
          autoComplete="given-name"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-village-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          placeholder="Jean"
        />
      </div>

      {/* Texte */}
      <div>
        <label htmlFor="avis-texte" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Commentaire <span className="text-gray-400">(optionnel)</span>
        </label>
        <textarea
          id="avis-texte"
          value={texte}
          onChange={e => setTexte(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-village-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          placeholder="Votre expérience..."
        />
        <p className="mt-0.5 text-right text-xs text-gray-400">{texte.length}/1000</p>
      </div>

      {erreur && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{erreur}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="rounded-lg bg-village-600 px-5 py-2 text-sm font-medium text-white hover:bg-village-700 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-village-500 focus:ring-offset-2"
      >
        {status === 'loading' ? 'Envoi...' : 'Envoyer l\'avis'}
      </button>
    </form>
  )
}
