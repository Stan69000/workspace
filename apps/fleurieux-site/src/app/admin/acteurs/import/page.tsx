import { prisma } from '@/lib/prisma'
import { ImportExportActeurs } from '@/components/admin/ImportExportActeurs'

export const dynamic = 'force-dynamic'

export default async function ImportExportActeursPage() {
  const categories = await prisma.categorie.findMany({
    orderBy: { ordre: 'asc' },
    select: { slug: true, nom: true },
  })

  return <ImportExportActeurs categories={categories} />
}
