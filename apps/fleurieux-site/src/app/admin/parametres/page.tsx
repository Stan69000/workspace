import type { Metadata } from 'next'
import { Card } from '@/components/ui/Card'
import { ModuleToggle } from '@/components/admin/AdminActions'
import { MODULES, getModules } from '@/lib/modules'

export const metadata: Metadata = { title: 'Paramètres — Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminParametresPage() {
  const modules = await getModules()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Modules du site</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Activez ou désactivez les rubriques publiques. Désactiver masque la page et l’entrée de menu (les données sont conservées).
        </p>
      </div>

      <Card className="divide-y divide-gray-100 dark:divide-gray-800">
        {MODULES.map(m => {
          const actif = modules[m.key] !== false
          return (
            <div key={m.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{m.label}</p>
                <p className="text-xs text-gray-400">{m.href} · {actif ? 'visible' : 'masqué'}</p>
              </div>
              <ModuleToggle moduleKey={m.key} actif={actif} />
            </div>
          )
        })}
      </Card>
    </div>
  )
}
