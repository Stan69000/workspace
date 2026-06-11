// Helpers date/heure ancrés sur le fuseau Europe/Paris (le serveur tourne en UTC).

const TZ = 'Europe/Paris'

// "mercredi 11 juin 2026"
export function parisDateLabel(d = new Date()): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(d)
}

// Composantes jour/mois/année à Paris (chaînes zéro-paddées : "11", "06", "2026")
export function parisJourMois(d = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('fr-FR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' })
      .formatToParts(d)
      .map(x => [x.type, x.value]),
  )
  return { jour: p.day, mois: p.month, annee: p.year }
}
