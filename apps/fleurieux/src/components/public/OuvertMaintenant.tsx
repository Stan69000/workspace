import type { Horaire } from '@prisma/client'
import { getStatutOuverture } from '@/lib/ouvert-maintenant'
import { Badge } from '@/components/ui/Badge'

interface Props {
  horaires: Horaire[]
  horairesNote?: string | null
}

export function OuvertMaintenant({ horaires, horairesNote }: Props) {
  const statut = getStatutOuverture(horaires, horairesNote)

  return (
    <div className="flex flex-col gap-1">
      <Badge variant={statut.ouvert ? 'green' : 'red'}>
        {statut.ouvert ? '● ' : '○ '}{statut.label}
      </Badge>
      {horairesNote && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{horairesNote}</p>
      )}
    </div>
  )
}
