// src/lib/search.ts
// Recherche transverse optimisée : insensible aux accents (unaccent), multi-mots (tous
// les mots doivent matcher), tolérante aux fautes sur le nom (trigrammes pg_trgm),
// multi-champs et classée par pertinence (similarité du nom).
import { Prisma } from '@prisma/client'
import { prisma } from './prisma'

export interface SearchHit {
  slug: string
  titre: string
  sous: string | null
  meta: string | null
}

export interface SearchResults {
  acteurs: SearchHit[]
  evenements: SearchHit[]
  randos: SearchHit[]
  actus: SearchHit[]
  total: number
}

const LIMIT = 8

const EMPTY: SearchResults = { acteurs: [], evenements: [], randos: [], actus: [], total: 0 }

function tokens(q: string): string[] {
  return q.toLowerCase().split(/\s+/).map(t => t.trim()).filter(Boolean).slice(0, 8)
}

// Chaque mot doit apparaître (sous-chaîne, sans accents) dans le texte concaténé.
function everyToken(blob: Prisma.Sql, ts: string[]): Prisma.Sql {
  return Prisma.join(
    ts.map(t => Prisma.sql`${blob} LIKE ('%' || unaccent(${t}) || '%')`),
    ' AND ',
  )
}

export async function searchAll(raw: string): Promise<SearchResults> {
  const q = (raw ?? '').trim().slice(0, 100)
  if (!q) return EMPTY
  const ts = tokens(q)

  const [acteurs, evenements, randos, actus] = await Promise.all([
    prisma.$queryRaw<SearchHit[]>(Prisma.sql`
      SELECT a.slug, a.nom AS titre, a.description AS sous, c.nom AS meta
      FROM acteurs a JOIN categories c ON c.id = a."categorieId"
      WHERE a.statut = 'PUBLIE' AND (
        (${everyToken(Prisma.sql`unaccent(lower(coalesce(a.nom,'') || ' ' || coalesce(a.description,'') || ' ' || coalesce(a."descriptionLongue",'') || ' ' || coalesce(a.adresse,'') || ' ' || coalesce(a.ville,'') || ' ' || c.nom))`, ts)})
        OR unaccent(lower(${q})) <% unaccent(lower(a.nom))
      )
      ORDER BY word_similarity(unaccent(lower(${q})), unaccent(lower(a.nom))) DESC, a.nom ASC
      LIMIT ${LIMIT}
    `),
    prisma.$queryRaw<SearchHit[]>(Prisma.sql`
      SELECT slug, titre, description AS sous, to_char("dateDebut", 'DD/MM/YYYY') AS meta
      FROM evenements
      WHERE statut = 'PUBLIE' AND (
        (${everyToken(Prisma.sql`unaccent(lower(coalesce(titre,'') || ' ' || coalesce(description,'') || ' ' || coalesce(lieu,'')))`, ts)})
        OR unaccent(lower(${q})) <% unaccent(lower(titre))
      )
      ORDER BY word_similarity(unaccent(lower(${q})), unaccent(lower(titre))) DESC, "dateDebut" DESC
      LIMIT ${LIMIT}
    `),
    prisma.$queryRaw<SearchHit[]>(Prisma.sql`
      SELECT slug, nom AS titre, description AS sous, difficulte::text AS meta
      FROM randos
      WHERE statut = 'PUBLIE' AND (
        (${everyToken(Prisma.sql`unaccent(lower(coalesce(nom,'') || ' ' || coalesce(description,'')))`, ts)})
        OR unaccent(lower(${q})) <% unaccent(lower(nom))
      )
      ORDER BY word_similarity(unaccent(lower(${q})), unaccent(lower(nom))) DESC, nom ASC
      LIMIT ${LIMIT}
    `),
    prisma.$queryRaw<SearchHit[]>(Prisma.sql`
      SELECT slug, titre, contenu AS sous, source AS meta
      FROM actus
      WHERE statut = 'PUBLIE' AND (
        (${everyToken(Prisma.sql`unaccent(lower(coalesce(titre,'') || ' ' || coalesce(contenu,'') || ' ' || coalesce(source,'')))`, ts)})
        OR unaccent(lower(${q})) <% unaccent(lower(titre))
      )
      ORDER BY word_similarity(unaccent(lower(${q})), unaccent(lower(titre))) DESC, "publishedAt" DESC NULLS LAST
      LIMIT ${LIMIT}
    `),
  ])

  return { acteurs, evenements, randos, actus, total: acteurs.length + evenements.length + randos.length + actus.length }
}
