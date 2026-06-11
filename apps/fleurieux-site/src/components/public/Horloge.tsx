'use client'
import { useEffect, useState } from 'react'

const FMT = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', second: '2-digit',
})

interface Props {
  className?: string
  withSeconds?: boolean
}

// Horloge live au fuseau de Paris. Rendu différé côté client pour éviter
// tout décalage d'hydratation entre l'UTC serveur et l'heure de Paris.
export function Horloge({ className, withSeconds = true }: Props) {
  const [now, setNow] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => {
      const s = FMT.format(new Date())
      setNow(withSeconds ? s : s.slice(0, 5))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [withSeconds])

  return (
    <time
      suppressHydrationWarning
      aria-label="Heure locale à Paris"
      className={className}
    >
      {now ?? (withSeconds ? '--:--:--' : '--:--')}
    </time>
  )
}
