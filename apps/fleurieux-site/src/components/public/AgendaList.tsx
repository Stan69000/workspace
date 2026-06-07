'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDateRelative } from '@/lib/utils'

type Evenement = {
  id: string
  titre: string
  description: string | null
  dateDebut: Date | string
  dateFin: Date | string | null
  lieu: string | null
  adresse: string | null
  gratuit: boolean
  prix: string | null
  lienInscription: string | null
  sourceUrl: string | null
}

function toGoogleCalendarDate(d: Date | string): string {
  return new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function googleCalendarUrl(evt: Evenement): string {
  const start = toGoogleCalendarDate(evt.dateDebut)
  const fallbackEnd = new Date(new Date(evt.dateDebut).getTime() + 2 * 60 * 60 * 1000)
  const end = toGoogleCalendarDate(evt.dateFin ?? fallbackEnd)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: evt.titre,
    dates: `${start}/${end}`,
    ...(evt.description && { details: evt.description }),
    ...(evt.lieu && { location: evt.lieu }),
  })
  return `https://www.google.com/calendar/render?${params}`
}

export function AgendaList({ evenements, siteUrl }: { evenements: Evenement[]; siteUrl: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggle = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected(selected.size === evenements.length ? new Set() : new Set(evenements.map(e => e.id)))

  const icalFeedUrl = `${siteUrl}/api/agenda/export`
  const icalExportUrl = selected.size > 0
    ? `${icalFeedUrl}?ids=${[...selected].join(',')}`
    : icalFeedUrl
  const exportLabel = selected.size > 0 ? `Exporter la sélection (${selected.size})` : 'Exporter tout'

  const googleSubUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icalFeedUrl)}`

  if (evenements.length === 0) {
    return <p className="py-16 text-center text-gray-400">Aucun événement à venir pour l&apos;instant.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={toggleAll}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
        >
          {selected.size === evenements.length ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
        <a
          href={icalExportUrl}
          download="agenda-fleurieux.ics"
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          📅 {exportLabel} en iCal
        </a>
        <a
          href={googleSubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248l-1.97 1.97a4.577 4.577 0 00-6.124 6.124l-1.97 1.97A7.5 7.5 0 0112 4.5a7.454 7.454 0 015.562 3.748zM12 16.5a4.5 4.5 0 110-9 4.5 4.5 0 010 9z"/></svg>
          S&apos;abonner sur Google Agenda
        </a>
      </div>

      <div className="space-y-3">
        {evenements.map(evt => (
          <label key={evt.id} className="block cursor-pointer">
            <Card hover className="flex items-start gap-4">
              <input
                type="checkbox"
                checked={selected.has(evt.id)}
                onChange={() => toggle(evt.id)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-village-600 focus:ring-village-500"
              />
              <div className="min-w-[56px] rounded-lg bg-village-50 p-3 text-center dark:bg-village-900/20">
                <p className="text-2xl font-bold leading-none text-village-700 dark:text-village-400">
                  {new Date(evt.dateDebut).getDate()}
                </p>
                <p className="text-xs capitalize text-village-600 dark:text-village-400">
                  {new Date(evt.dateDebut).toLocaleDateString('fr-FR', { month: 'short' })}
                </p>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-gray-900 dark:text-gray-100">{evt.titre}</h2>
                  {evt.gratuit && <Badge variant="green">Gratuit</Badge>}
                  {evt.prix && !evt.gratuit && <Badge variant="blue">{evt.prix}</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {formatDateRelative(evt.dateDebut)}
                  {evt.lieu ? ` · ${evt.lieu}` : ''}
                </p>
                {evt.description && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{evt.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3">
                  <a
                    href={googleCalendarUrl(evt)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    + Google Agenda
                  </a>
                  {evt.lienInscription && (
                    <a
                      href={evt.lienInscription}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs font-medium text-village-600 hover:underline dark:text-village-400"
                    >
                      S&apos;inscrire →
                    </a>
                  )}
                  {evt.sourceUrl && (
                    <a
                      href={evt.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-gray-400 hover:text-gray-600 hover:underline dark:hover:text-gray-300"
                    >
                      Source →
                    </a>
                  )}
                </div>
              </div>
            </Card>
          </label>
        ))}
      </div>
    </div>
  )
}
