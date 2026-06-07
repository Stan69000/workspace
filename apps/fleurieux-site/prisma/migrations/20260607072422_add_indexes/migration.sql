-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MODERATEUR', 'CONTRIBUTEUR', 'HABITANT');

-- CreateEnum
CREATE TYPE "Jour" AS ENUM ('LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE');

-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('BROUILLON', 'EN_ATTENTE', 'PUBLIE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "StatutAvis" AS ENUM ('EN_ATTENTE', 'APPROUVE', 'REFUSE', 'SIGNALE');

-- CreateEnum
CREATE TYPE "Difficulte" AS ENUM ('FACILE', 'INTERMEDIAIRE', 'DIFFICILE');

-- CreateEnum
CREATE TYPE "TypeCircuit" AS ENUM ('BOUCLE', 'ALLER_RETOUR', 'LINEAIRE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "prenom" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'HABITANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "idToken" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acteurs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "descriptionLongue" TEXT,
    "emoji" TEXT DEFAULT '🏪',
    "categorieId" TEXT NOT NULL,
    "statut" "Statut" NOT NULL DEFAULT 'BROUILLON',
    "miseEnAvant" BOOLEAN NOT NULL DEFAULT false,
    "avisActives" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adresse" TEXT,
    "codePostal" TEXT DEFAULT '69210',
    "ville" TEXT DEFAULT 'Fleurieux-sur-l''Arbresle',
    "telephone" TEXT,
    "email" TEXT,
    "siteWeb" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "accepteEspeces" BOOLEAN NOT NULL DEFAULT true,
    "accepteCB" BOOLEAN NOT NULL DEFAULT false,
    "accepteCheque" BOOLEAN NOT NULL DEFAULT false,
    "accepteVirement" BOOLEAN NOT NULL DEFAULT false,
    "horairesNote" TEXT,
    "contributeurId" TEXT,
    "noteAverage" DOUBLE PRECISION DEFAULT 0,
    "nbAvis" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "acteurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "emoji" TEXT,
    "description" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horaires" (
    "id" TEXT NOT NULL,
    "acteurId" TEXT NOT NULL,
    "jour" "Jour" NOT NULL,
    "ouvert" BOOLEAN NOT NULL DEFAULT true,
    "ouverture" TEXT,
    "fermeture" TEXT,

    CONSTRAINT "horaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "acteurId" TEXT,
    "randoId" TEXT,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags_acteurs" (
    "acteurId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "tags_acteurs_pkey" PRIMARY KEY ("acteurId","tagId")
);

-- CreateTable
CREATE TABLE "avis" (
    "id" TEXT NOT NULL,
    "acteurId" TEXT NOT NULL,
    "userId" TEXT,
    "prenomAuteur" TEXT,
    "estHabitant" BOOLEAN NOT NULL DEFAULT true,
    "note" INTEGER NOT NULL,
    "texte" TEXT,
    "statut" "StatutAvis" NOT NULL DEFAULT 'EN_ATTENTE',
    "signale" BOOLEAN NOT NULL DEFAULT false,
    "nbUtiles" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evenements" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "lieu" TEXT,
    "adresse" TEXT,
    "gratuit" BOOLEAN NOT NULL DEFAULT true,
    "prix" TEXT,
    "lienInscription" TEXT,
    "imageUrl" TEXT,
    "statut" "Statut" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acteurId" TEXT,
    "contributeurId" TEXT,

    CONSTRAINT "evenements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "randos" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "difficulte" "Difficulte" NOT NULL DEFAULT 'FACILE',
    "distanceKm" DOUBLE PRECISION,
    "dureeMinutes" INTEGER,
    "deniveleM" INTEGER,
    "typeCircuit" "TypeCircuit" NOT NULL DEFAULT 'BOUCLE',
    "depart" TEXT,
    "gpxUrl" TEXT,
    "statut" "Statut" NOT NULL DEFAULT 'PUBLIE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contributeurId" TEXT,

    CONSTRAINT "randos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "points_interet" (
    "id" TEXT NOT NULL,
    "randoId" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "points_interet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actus" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "contenu" TEXT,
    "source" TEXT,
    "lienExterne" TEXT,
    "imageUrl" TEXT,
    "statut" "Statut" NOT NULL DEFAULT 'EN_ATTENTE',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "contributeurId" TEXT,

    CONSTRAINT "actus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "acteurs_slug_key" ON "acteurs"("slug");

-- CreateIndex
CREATE INDEX "acteurs_statut_idx" ON "acteurs"("statut");

-- CreateIndex
CREATE INDEX "acteurs_categorieId_statut_idx" ON "acteurs"("categorieId", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nom_key" ON "categories"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "horaires_acteurId_jour_key" ON "horaires"("acteurId", "jour");

-- CreateIndex
CREATE UNIQUE INDEX "tags_nom_key" ON "tags"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "tags_slug_key" ON "tags"("slug");

-- CreateIndex
CREATE INDEX "avis_acteurId_statut_idx" ON "avis"("acteurId", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "evenements_slug_key" ON "evenements"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "randos_slug_key" ON "randos"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "actus_slug_key" ON "actus"("slug");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acteurs" ADD CONSTRAINT "acteurs_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acteurs" ADD CONSTRAINT "acteurs_contributeurId_fkey" FOREIGN KEY ("contributeurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horaires" ADD CONSTRAINT "horaires_acteurId_fkey" FOREIGN KEY ("acteurId") REFERENCES "acteurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_acteurId_fkey" FOREIGN KEY ("acteurId") REFERENCES "acteurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_randoId_fkey" FOREIGN KEY ("randoId") REFERENCES "randos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_acteurs" ADD CONSTRAINT "tags_acteurs_acteurId_fkey" FOREIGN KEY ("acteurId") REFERENCES "acteurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags_acteurs" ADD CONSTRAINT "tags_acteurs_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_acteurId_fkey" FOREIGN KEY ("acteurId") REFERENCES "acteurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avis" ADD CONSTRAINT "avis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements" ADD CONSTRAINT "evenements_acteurId_fkey" FOREIGN KEY ("acteurId") REFERENCES "acteurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evenements" ADD CONSTRAINT "evenements_contributeurId_fkey" FOREIGN KEY ("contributeurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "randos" ADD CONSTRAINT "randos_contributeurId_fkey" FOREIGN KEY ("contributeurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "points_interet" ADD CONSTRAINT "points_interet_randoId_fkey" FOREIGN KEY ("randoId") REFERENCES "randos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actus" ADD CONSTRAINT "actus_contributeurId_fkey" FOREIGN KEY ("contributeurId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
