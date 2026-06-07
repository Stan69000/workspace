'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { ActeurMapData } from '@/types'
import { getStatutOuverture } from '@/lib/ouvert-maintenant'
import { formatEtoiles } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  acteur: ActeurMapData | null
  onFermer: () => void
}

export function ActeurPanneauLateral({ acteur, onFermer }: Props) {
  const titreRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (acteur) titreRef.current?.focus()
  }, [acteur])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onFermer])

  const statut = acteur ? getStatutOuverture(acteur.horaires as Parameters<typeof getStatutOuverture>[0], acteur.horairesNote) : null

  return (
    <>
      {/* Overlay mobile */}
      {acteur && (
        <div
          className="fixed inset-0 z-[1000] bg-black/30 md:hidden"
          onClick={onFermer}
          aria-hidden="true"
        />
      )}

      {/* Panneau */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="panneau-titre"
        className={cn(
          'fixed top-0 right-0 z-[1001] h-full overflow-y-auto',
          'w-full sm:w-96',
          'bg-white dark:bg-gray-900 shadow-2xl',
          'transition-transform duration-300 ease-in-out',
          acteur ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {acteur && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-3xl flex-shrink-0" aria-hidden="true">
                  {acteur.emoji ?? acteur.categorie.emoji ?? '🏪'}
                </span>
                <div className="min-w-0">
                  <h2
                    id="panneau-titre"
                    ref={titreRef}
                    tabIndex={-1}
                    className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight outline-none"
                  >
                    {acteur.nom}
                  </h2>
                  <p className="text-sm text-village-600 dark:text-village-400 mt-0.5">
                    {acteur.categorie.nom}
                  </p>
                </div>
              </div>
              <button
                onClick={onFermer}
                aria-label="Fermer le panneau"
                className="flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-village-500"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Corps */}
            <div className="flex-1 p-5 space-y-4">
              {/* Statut ouverture */}
              {statut && (
                <div className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                  statut.ouvert
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
                )}>
                  <span className="w-2 h-2 rounded-full bg-current" aria-hidden="true" />
                  {statut.label}
                </div>
              )}

              {/* Note */}
              {acteur.noteAverage != null && acteur.nbAvis > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-amber-500" aria-label={`Note : ${acteur.noteAverage} sur 5`}>
                    {formatEtoiles(acteur.noteAverage)}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({acteur.nbAvis} avis)
                  </span>
                </div>
              )}

              {/* Description */}
              {acteur.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{acteur.description}</p>
              )}

              {/* Infos de contact */}
              <dl className="space-y-2 text-sm">
                {acteur.adresse && (
                  <div className="flex gap-2">
                    <dt className="sr-only">Adresse</dt>
                    <span aria-hidden="true" className="flex-shrink-0">📍</span>
                    <dd className="text-gray-700 dark:text-gray-300">{acteur.adresse}</dd>
                  </div>
                )}
                {acteur.telephone && (
                  <div className="flex gap-2">
                    <dt className="sr-only">Téléphone</dt>
                    <span aria-hidden="true" className="flex-shrink-0">📞</span>
                    <dd>
                      <a
                        href={`tel:${acteur.telephone}`}
                        className="text-village-600 hover:underline dark:text-village-400 focus:outline-none focus:ring-2 focus:ring-village-500 rounded"
                      >
                        {acteur.telephone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Pied */}
            <div className="p-5 border-t border-gray-200 dark:border-gray-700">
              <Link
                href={`/acteurs/${acteur.slug}`}
                className="block w-full rounded-lg bg-village-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-village-700 focus:outline-none focus:ring-2 focus:ring-village-500 focus:ring-offset-2 transition-colors"
              >
                Voir la fiche complète →
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
