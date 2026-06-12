import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Statut } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { geocodeAdresse } from '@/lib/geocode'
import { logger } from '@/lib/logger'
import { JOURS, parseBool, parseHoraire, parsePhotos, parseEtatMaj } from '@/lib/acteur-csv'

const rowSchema = z.object({
  nom: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  categorieSlug: z.string().min(1),
  emoji: z.string().optional(),
  description: z.string().optional(),
  descriptionLongue: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  ville: z.string().optional(),
  telephone: z.string().optional(),
  // Champs libres : on ne casse pas tout le batch sur une URL/e-mail non stricts
  // (les valeurs viennent de la base, gérées par l'admin).
  email: z.string().optional(),
  siteWeb: z.string().optional(),
  instagram: z.string().optional(),
  accepteEspeces: z.string().optional(),
  accepteCB: z.string().optional(),
  accepteCheque: z.string().optional(),
  accepteVirement: z.string().optional(),
  horaire_lundi: z.string().optional(),
  horaire_mardi: z.string().optional(),
  horaire_mercredi: z.string().optional(),
  horaire_jeudi: z.string().optional(),
  horaire_vendredi: z.string().optional(),
  horaire_samedi: z.string().optional(),
  horaire_dimanche: z.string().optional(),
  horairesNote: z.string().optional(),
  photos: z.string().optional(),
  statut: z.enum(['PUBLIE', 'BROUILLON', 'EN_ATTENTE', 'ARCHIVE']).optional(),
  etatMaj: z.string().optional(), // valeur normalisée via parseEtatMaj (accepte alias)
  noteMaj: z.string().optional(),
})

// Validation faite par ligne (dans la boucle) : une ligne invalide est signalée
// sans faire échouer tout le lot.
const bodySchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(1000),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    const role = session?.user.role ?? ''
    if (!session || !['ADMIN', 'CONTRIBUTEUR'].includes(role)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }
    const isAdmin = role === 'ADMIN'

    const body = await req.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const results: { slug: string; action: 'created' | 'updated' | 'error'; error?: string }[] = []

    for (const raw of parsed.data.rows) {
      try {
        const parsedRow = rowSchema.safeParse(raw)
        if (!parsedRow.success) {
          const slug = typeof raw.slug === 'string' ? raw.slug : '?'
          results.push({
            slug,
            action: 'error',
            error: 'Ligne invalide : ' + parsedRow.error.issues.map(i => `${i.path.join('.')} ${i.message}`).join('; ').slice(0, 200),
          })
          continue
        }
        const row = parsedRow.data

        const categorie = await prisma.categorie.findUnique({ where: { slug: row.categorieSlug } })
        if (!categorie) {
          results.push({ slug: row.slug, action: 'error', error: `Catégorie "${row.categorieSlug}" introuvable` })
          continue
        }

        const existing = await prisma.acteur.findUnique({
          where: { slug: row.slug },
          select: { id: true, contributeurId: true, adresse: true, latitude: true },
        })

        // H1 : un CONTRIBUTEUR ne peut écraser que ses propres fiches
        if (existing && !isAdmin && existing.contributeurId !== session.user.id) {
          results.push({ slug: row.slug, action: 'error', error: 'Fiche appartenant à un autre contributeur' })
          continue
        }

        // Règle générale : une colonne absente = champ inchangé (import partiel sûr).
        const data: Record<string, unknown> = { nom: row.nom, categorieId: categorie.id }
        const setText = (key: string, v: string | undefined) => { if (v !== undefined) data[key] = v.trim() || null }
        setText('emoji', row.emoji)
        setText('description', row.description)
        setText('descriptionLongue', row.descriptionLongue)
        setText('adresse', row.adresse)
        setText('codePostal', row.codePostal)
        setText('ville', row.ville)
        setText('telephone', row.telephone)
        setText('email', row.email)
        setText('siteWeb', row.siteWeb)
        setText('instagram', row.instagram)
        setText('horairesNote', row.horairesNote)
        setText('noteMaj', row.noteMaj)
        const etat = parseEtatMaj(row.etatMaj)
        if (etat) data.etatMaj = etat

        const espece = parseBool(row.accepteEspeces); if (espece !== undefined) data.accepteEspeces = espece
        const cb = parseBool(row.accepteCB); if (cb !== undefined) data.accepteCB = cb
        const cheque = parseBool(row.accepteCheque); if (cheque !== undefined) data.accepteCheque = cheque
        const virement = parseBool(row.accepteVirement); if (virement !== undefined) data.accepteVirement = virement

        // H1 : un CONTRIBUTEUR ne publie jamais directement (passe par la modération)
        if (row.statut !== undefined) data.statut = isAdmin ? (row.statut as Statut) : Statut.EN_ATTENTE

        // Géocodage seulement si l'adresse est fournie et a changé (ou coords manquantes)
        if (row.adresse !== undefined) {
          const nouvelle = row.adresse.trim() || null
          if (!nouvelle) {
            data.latitude = null
            data.longitude = null
          } else if (!existing || nouvelle !== (existing.adresse ?? null) || existing.latitude == null) {
            const coords = await geocodeAdresse(row.adresse, row.codePostal, row.ville)
            if (coords) { data.latitude = coords.lat; data.longitude = coords.lon }
          }
        }

        // Horaires (remplacés si au moins une colonne horaire_* est présente)
        const horaireVals: Record<string, string | undefined> = {
          LUNDI: row.horaire_lundi, MARDI: row.horaire_mardi, MERCREDI: row.horaire_mercredi,
          JEUDI: row.horaire_jeudi, VENDREDI: row.horaire_vendredi, SAMEDI: row.horaire_samedi,
          DIMANCHE: row.horaire_dimanche,
        }
        const horairesProvided = JOURS.some(j => horaireVals[j] !== undefined)
        const photosList = parsePhotos(row.photos) // null = colonne absente

        await prisma.$transaction(async (tx) => {
          let acteurId: string
          if (existing) {
            await tx.acteur.update({ where: { slug: row.slug }, data })
            acteurId = existing.id
          } else {
            const created = await tx.acteur.create({
              data: {
                ...data,
                slug: row.slug,
                contributeurId: session.user.id,
                statut: (data.statut as Statut | undefined) ?? (isAdmin ? undefined : Statut.EN_ATTENTE),
              },
            })
            acteurId = created.id
          }

          if (horairesProvided) {
            await tx.horaire.deleteMany({ where: { acteurId } })
            const horaireRows = JOURS.flatMap(j => {
              const s = parseHoraire(horaireVals[j])
              return s ? [{ acteurId, jour: j, ouvert: s.ouvert, ouverture: s.ouverture, fermeture: s.fermeture }] : []
            })
            if (horaireRows.length) await tx.horaire.createMany({ data: horaireRows })
          }

          if (photosList !== null) {
            await tx.photo.deleteMany({ where: { acteurId } })
            if (photosList.length) {
              await tx.photo.createMany({ data: photosList.map((url, i) => ({ acteurId, url, alt: row.nom, ordre: i })) })
            }
          }
        })

        results.push({ slug: row.slug, action: existing ? 'updated' : 'created' })
      } catch (rowErr) {
        results.push({ slug: row.slug, action: 'error', error: String(rowErr) })
      }
    }

    const created = results.filter(r => r.action === 'created').length
    const updated = results.filter(r => r.action === 'updated').length
    const errors = results.filter(r => r.action === 'error').length

    logger.info('import CSV acteurs', { created, updated, errors, userId: session.user.id })
    return NextResponse.json({ created, updated, errors, results })
  } catch (err) {
    logger.error('[POST /api/acteurs/import]', { error: String(err) })
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
