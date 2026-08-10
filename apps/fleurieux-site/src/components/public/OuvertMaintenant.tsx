import { getStatutOuverture, type HoraireOuverture } from '@/lib/ouvert-maintenant'
import { Badge } from '@/components/ui/Badge'

interface Props {
  horaires: HoraireOuverture[]
  horairesNote?: string | null
}

export function OuvertMaintenant({ horaires, horairesNote }: Props) {
  const statut = getStatutOuverture(horaires, horairesNote)

  return (
    <div className="flex flex-col gap-1">
      <Badge variant={statut.indetermine ? 'gray' : statut.ouvert ? 'green' : 'red'}>
        <span aria-hidden="true">{statut.indetermine ? '◦ ' : statut.ouvert ? '● ' : '○ '}</span>
        {statut.label}
      </Badge>
      {horairesNote && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{horairesNote}</p>
      )}
    </div>
  )
}
