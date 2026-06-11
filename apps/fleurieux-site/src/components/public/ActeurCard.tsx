import Link from 'next/link'
import Image from 'next/image'
import type { ActeurCarte } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Props {
  acteur: ActeurCarte
}

export function ActeurCard({ acteur }: Props) {
  const photo = acteur.photos[0]

  return (
    <Link href={`/acteurs/${acteur.slug}`}>
      <Card hover className="h-full flex flex-col overflow-hidden p-0">
        {/* Image */}
        <div className="relative h-36 w-full bg-gray-100 dark:bg-gray-800">
          {photo ? (
            <Image src={photo.url} alt={photo.alt ?? acteur.nom} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl" aria-hidden="true">{acteur.emoji ?? '🏪'}</div>
          )}
        </div>

        {/* Contenu */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm text-village-600 dark:text-village-400">
                <span aria-hidden="true">{acteur.categorie.emoji} </span>{acteur.categorie.nom}
              </p>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{acteur.nom}</h3>
            </div>
          </div>

          {acteur.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{acteur.description}</p>
          )}

          {acteur.telephone && (
            <div className="mt-auto flex items-center justify-end">
              <Badge variant="gray" className="text-sm">{acteur.telephone}</Badge>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
