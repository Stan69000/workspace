import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'

// Colonnes du fichier d'export = format attendu par l'import (round-trip).
const COLUMNS = [
  'nom', 'slug', 'categorieSlug', 'description', 'descriptionLongue',
  'adresse', 'codePostal', 'ville', 'telephone', 'email', 'siteWeb', 'instagram',
  'horairesNote', 'statut', 'etatMaj', 'noteMaj',
]

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    const role = session?.user.role ?? ''
    if (!session || !['ADMIN', 'CONTRIBUTEUR'].includes(role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const categorieSlug = searchParams.get('categorie')?.trim() || ''
    const format = searchParams.get('format') === 'json' ? 'json' : 'csv'

    let categorieId: string | undefined
    if (categorieSlug) {
      const cat = await prisma.categorie.findUnique({ where: { slug: categorieSlug }, select: { id: true } })
      if (!cat) return NextResponse.json({ error: `Catégorie "${categorieSlug}" introuvable` }, { status: 404 })
      categorieId = cat.id
    }

    const acteurs = await prisma.acteur.findMany({
      where: categorieId ? { categorieId } : undefined,
      orderBy: [{ categorie: { ordre: 'asc' } }, { nom: 'asc' }],
      select: {
        nom: true, slug: true, description: true, descriptionLongue: true,
        adresse: true, codePostal: true, ville: true, telephone: true, email: true,
        siteWeb: true, instagram: true, horairesNote: true, statut: true,
        etatMaj: true, noteMaj: true, categorie: { select: { slug: true } },
      },
    })

    const rows = acteurs.map(a => ({
      nom: a.nom,
      slug: a.slug,
      categorieSlug: a.categorie.slug,
      description: a.description ?? '',
      descriptionLongue: a.descriptionLongue ?? '',
      adresse: a.adresse ?? '',
      codePostal: a.codePostal ?? '',
      ville: a.ville ?? '',
      telephone: a.telephone ?? '',
      email: a.email ?? '',
      siteWeb: a.siteWeb ?? '',
      instagram: a.instagram ?? '',
      horairesNote: a.horairesNote ?? '',
      statut: a.statut,
      etatMaj: a.etatMaj,
      noteMaj: a.noteMaj ?? '',
    }))

    logger.info('export acteurs', { count: rows.length, categorie: categorieSlug || 'tous', format, userId: session.user.id })

    const stamp = new Date().toISOString().slice(0, 10)
    const suffix = categorieSlug ? `-${categorieSlug}` : '-tous'

    if (format === 'json') {
      return new NextResponse(JSON.stringify(rows, null, 2), {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="acteurs${suffix}-${stamp}.json"`,
        },
      })
    }

    const csv = Papa.unparse({ fields: COLUMNS, data: rows })
    // BOM UTF-8 pour qu'Excel ouvre les accents correctement.
    return new NextResponse('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="acteurs${suffix}-${stamp}.csv"`,
      },
    })
  } catch (err) {
    logger.error('[GET /api/acteurs/export]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
