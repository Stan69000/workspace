import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-village-700 dark:text-village-400">
              <span aria-hidden="true">🌿</span>{' '}Fleurieux
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Portail du village de Fleurieux-sur-l&apos;Arbresle (69210)
            </p>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Découvrir</h2>
            <ul className="mt-2 space-y-1">
              {[['Acteurs locaux', '/acteurs'], ['Agenda', '/agenda'], ['Randonnées', '/randos'], ['Actualités', '/actus']].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-600 hover:text-village-600 dark:text-gray-400 dark:hover:text-village-400">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contribuer</h2>
            <ul className="mt-2 space-y-1">
              {[['Proposer un acteur', '/acteurs/nouveau'], ['Signaler une erreur', '/contact']].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-600 hover:text-village-600 dark:text-gray-400 dark:hover:text-village-400">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Le Singe du Numérique</h2>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Association loi 1901<br />Fleurieux-sur-l&apos;Arbresle
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 dark:border-gray-800">
          <span aria-hidden="true">© </span>{new Date().getFullYear()} Fleurieux-sur-l&apos;Arbresle — Projet open source MIT
        </div>
      </div>
    </footer>
  )
}
