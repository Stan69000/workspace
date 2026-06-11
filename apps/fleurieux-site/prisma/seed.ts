// prisma/seed.ts
// Données initiales pour Fleurieux-sur-l'Arbresle

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { checkPasswordStrength } from '../src/lib/password-policy'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')

  // ── Admin
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) throw new Error('ADMIN_PASSWORD env var manquant')
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) throw new Error('ADMIN_EMAIL env var manquant')
  // SEC-017 : refuse de semer un mot de passe admin faible ou présent dans une fuite
  const pwCheck = checkPasswordStrength(adminPassword)
  if (!pwCheck.ok) throw new Error(`ADMIN_PASSWORD rejeté : ${pwCheck.reason}`)
  const passwordHash = await bcrypt.hash(adminPassword, 12)
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin Fleurieux',
      role: 'ADMIN',
      emailVerified: true,
      accounts: {
        create: {
          accountId: 'admin',
          providerId: 'credential',
          password: passwordHash,
        }
      }
    }
  })
  console.log('✅ Admin créé:', admin.email)

  // ── Catégories
  const categories = await Promise.all([
    prisma.categorie.upsert({ where: { slug: 'producteurs-locaux' }, update: {}, create: { nom: 'Producteurs locaux', slug: 'producteurs-locaux', emoji: '🌱', ordre: 1 } }),
    prisma.categorie.upsert({ where: { slug: 'commerces-artisans' }, update: {}, create: { nom: 'Commerces & Artisans', slug: 'commerces-artisans', emoji: '🛒', ordre: 2 } }),
    prisma.categorie.upsert({ where: { slug: 'restauration' }, update: {}, create: { nom: 'Restauration', slug: 'restauration', emoji: '🍽️', ordre: 3 } }),
    prisma.categorie.upsert({ where: { slug: 'associations' }, update: {}, create: { nom: 'Associations', slug: 'associations', emoji: '🤝', ordre: 4 } }),
    prisma.categorie.upsert({ where: { slug: 'sport-loisirs' }, update: {}, create: { nom: 'Sport & Loisirs', slug: 'sport-loisirs', emoji: '🏃', ordre: 5 } }),
    prisma.categorie.upsert({ where: { slug: 'culture-art' }, update: {}, create: { nom: 'Culture & Art', slug: 'culture-art', emoji: '🎭', ordre: 6 } }),
    prisma.categorie.upsert({ where: { slug: 'sante-bien-etre' }, update: {}, create: { nom: 'Santé & Bien-être', slug: 'sante-bien-etre', emoji: '🏥', ordre: 7 } }),
    prisma.categorie.upsert({ where: { slug: 'services-publics' }, update: {}, create: { nom: 'Services publics', slug: 'services-publics', emoji: '🏛️', ordre: 8 } }),
  ])
  console.log('✅ Catégories créées:', categories.length)

  // ── Acteurs de démo
  const jardin = await prisma.acteur.upsert({
    where: { slug: 'le-jardin-fleurinois' },
    update: {},
    create: {
      slug: 'le-jardin-fleurinois',
      nom: 'Le Jardin Fleurinois',
      emoji: '🌱',
      description: 'GAEC maraîcher, vente directe et frigo solidaire',
      descriptionLongue: "Le Jardin Fleurinois est un GAEC maraîcher installé à Fleurieux-sur-l'Arbresle depuis 2015. David et Catherine Perrelle y cultivent des légumes de saison en agriculture raisonnée, vendus chaque vendredi en vente directe sur l'exploitation.",
      categorieId: categories[0].id,
      statut: 'PUBLIE',
      adresse: 'Route du Jardin',
      codePostal: '69210',
      ville: "Fleurieux-sur-l'Arbresle",
      accepteEspeces: true,
      accepteCB: true,
      accepteCheque: true,
      horairesNote: 'Fermé en août. Paniers sur commande possible.',
      horaires: {
        create: [
          { jour: 'LUNDI',    ouvert: false },
          { jour: 'MARDI',    ouvert: false },
          { jour: 'MERCREDI', ouvert: false },
          { jour: 'JEUDI',    ouvert: false },
          { jour: 'VENDREDI', ouvert: true, ouverture: '08:00', fermeture: '12:00' },
          { jour: 'SAMEDI',   ouvert: false },
          { jour: 'DIMANCHE', ouvert: false },
        ]
      }
    }
  })

  const bar = await prisma.acteur.upsert({
    where: { slug: 'au-ptit-clin-doeil' },
    update: {},
    create: {
      slug: 'au-ptit-clin-doeil',
      nom: "Au P'tit Clin d'Œil",
      emoji: '🍺',
      description: 'Bar-restaurant. Jazz live, cuisine maison.',
      descriptionLongue: "Le nouveau repaire du village. Place des deux chouettes, concerts de jazz réguliers, ambiance chaleureuse et cuisine maison.",
      categorieId: categories[2].id,
      statut: 'PUBLIE',
      adresse: 'Place des deux chouettes',
      codePostal: '69210',
      ville: "Fleurieux-sur-l'Arbresle",
    }
  })

  const mjc = await prisma.acteur.upsert({
    where: { slug: 'mjc-eveux-fleurieux' },
    update: {},
    create: {
      slug: 'mjc-eveux-fleurieux',
      nom: 'MJC Éveux · Fleurieux',
      emoji: '🎪',
      description: 'Centre de loisirs, ateliers, activités jeunesse et adultes.',
      descriptionLongue: "Les Maisons des Jeunes et de la Culture sont ouvertes à tous. Ateliers créatifs, centre de loisirs, activités culturelles et sportives toute l'année.",
      categorieId: categories[3].id,
      statut: 'PUBLIE',
      adresse: 'Chemin de la MJC',
    }
  })

  console.log('✅ Acteurs créés:', jardin.nom, bar.nom, mjc.nom)

  // ── Randonnées
  await prisma.rando.upsert({
    where: { slug: 'boucle-du-bourg' },
    update: {},
    create: {
      slug: 'boucle-du-bourg',
      nom: 'Boucle du Bourg',
      description: 'Parcours classique autour du bourg de Fleurieux, en grande partie en sous-bois.',
      difficulte: 'FACILE',
      distanceKm: 6.4,
      dureeMinutes: 105,
      deniveleM: 180,
      typeCircuit: 'BOUCLE',
      depart: 'Place Benoît Dubost',
      statut: 'PUBLIE',
    }
  })

  await prisma.rando.upsert({
    where: { slug: 'tour-des-hameaux' },
    update: {},
    create: {
      slug: 'tour-des-hameaux',
      nom: 'Tour des hameaux',
      description: 'Circuit traversant les différents hameaux de la commune avec de beaux points de vue.',
      difficulte: 'INTERMEDIAIRE',
      distanceKm: 8.4,
      dureeMinutes: 150,
      deniveleM: 310,
      typeCircuit: 'BOUCLE',
      depart: 'Place Benoît Dubost',
      statut: 'PUBLIE',
    }
  })

  console.log('✅ Randonnées créées')

  // ── Événements
  await prisma.evenement.upsert({
    where: { slug: 'fete-de-la-musique-2026' },
    update: {},
    create: {
      slug: 'fete-de-la-musique-2026',
      titre: 'Fête de la Musique',
      description: 'Concert en plein air organisé par Les Fleurinous à l\'Espace François-Baraduc.',
      dateDebut: new Date('2026-06-21T18:00:00'),
      dateFin: new Date('2026-06-21T23:00:00'),
      lieu: 'Espace François-Baraduc',
      gratuit: true,
      statut: 'PUBLIE',
      acteurId: mjc.id,
    }
  })

  console.log('✅ Événements créés')
  console.log('🎉 Seed terminé !')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
