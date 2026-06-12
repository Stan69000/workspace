import { getTransportsData } from '@/lib/transports'
import { TransportsPage } from '@/components/public/TransportsPage'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Transports' }
export const revalidate = 120

// Travaux de régénération des voies (tronçon Tassin–Charbonnières).
// Source : Mairie de L'Arbresle / TER AURA. Bandeau auto-masqué après la fin.
const WORKS_START = Date.parse('2026-07-06T00:00:00+02:00')
const WORKS_END = Date.parse('2026-08-22T00:00:00+02:00')

const TER_AURA = 'https://www.ter.sncf.com/auvergne-rhone-alpes'
const TER_TRAVAUX = 'https://www.ter.sncf.com/auvergne-rhone-alpes/se-deplacer/info-trafic/travaux'
const SNCF_CONNECT = 'https://www.sncf-connect.com/ter-auvergne-rhone-alpes'
const TCL = 'https://www.tcl.fr'
const MAIRIE_TRAVAUX = 'https://www.mairie-larbresle.fr/actualites/2026/06/02/info-travaux-regeneration-de-la-voie-ferree-sur-la-ligne-du-tram-train.html'

const worksDetail =
  "Régénération des voies entre Tassin et Charbonnières. Le tram-train reste assuré entre Sain-Bel / L'Arbresle et Charbonnières (Fleurieux desservi), puis bus de substitution jusqu'à Lyon Saint-Paul aux horaires habituels (2 cars/h en pointe, 1/h en heures creuses)."

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-green-700 underline underline-offset-2 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
      {children}
    </a>
  )
}

export default async function Page() {
  let initial = null
  try {
    initial = await getTransportsData()
  } catch {
    // Le composant client gère l'erreur
  }

  const nowMs = Date.now()
  const showWorks = nowMs < WORKS_END
  const worksOngoing = nowMs >= WORKS_START

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Transports</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Gare de Fleurieux-sur-l&apos;Arbresle — tram-train ligne 22 (Lyon Saint-Paul ↔ Sain-Bel)
        </p>
      </div>

      {showWorks && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <p className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
            <span aria-hidden="true">🚧</span>
            Travaux ligne 22 — {worksOngoing ? 'en cours, jusqu’au 21 août 2026' : 'du 6 juillet au 21 août 2026'}
          </p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{worksDetail}</p>
          <p className="mt-2 text-sm">
            <ExtLink href={TER_TRAVAUX}>Info trafic TER</ExtLink>
            {' · '}
            <ExtLink href={MAIRIE_TRAVAUX}>Détails (Mairie de L&apos;Arbresle)</ExtLink>
          </p>
        </div>
      )}

      <TransportsPage initial={initial} />

      <section className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Aller à Lyon depuis Fleurieux</h2>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <span aria-hidden="true">🚆</span>
            <span><strong>Tram-train ligne 22</strong> → Lyon Saint-Paul, direct depuis la gare de Fleurieux (prochains passages en temps réel ci-dessus).</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true">🚌</span>
            <span><strong>Bus 216</strong> → Lyon Gorge-de-Loup, direct depuis les arrêts de Fleurieux (temps réel ci-dessus).</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true">🚧</span>
            <span><strong>Été 2026</strong> : pendant les travaux, tram-train jusqu&apos;à Charbonnières puis bus de substitution vers Lyon Saint-Paul.</span>
          </li>
          <li className="flex gap-2">
            <span aria-hidden="true">ℹ️</span>
            <span>Le <strong>bus 86</strong> (Gorge-de-Loup ↔ La Tour-de-Salvagny) ne dessert pas Fleurieux ; utile seulement en correspondance depuis Tassin, Charbonnières ou Demi-Lune.</span>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Liens utiles</h2>
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          <li><ExtLink href={TER_AURA}>TER Auvergne-Rhône-Alpes</ExtLink></li>
          <li><ExtLink href={SNCF_CONNECT}>SNCF Connect (TER AURA)</ExtLink></li>
          <li><ExtLink href={TER_TRAVAUX}>Info trafic &amp; travaux</ExtLink></li>
          <li><ExtLink href={TCL}>TCL (bus)</ExtLink></li>
        </ul>
      </section>
    </div>
  )
}
