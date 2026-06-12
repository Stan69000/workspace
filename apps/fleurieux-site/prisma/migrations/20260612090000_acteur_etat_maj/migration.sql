-- État de mise à jour des fiches acteurs (suivi des MAJ : ouvert/fermé/changé).

-- CreateEnum
CREATE TYPE "EtatMaj" AS ENUM ('ACTIF', 'A_VERIFIER', 'MODIFIE', 'FERME');

-- AlterTable
ALTER TABLE "acteurs" ADD COLUMN     "etatMaj" "EtatMaj" NOT NULL DEFAULT 'ACTIF',
ADD COLUMN     "noteMaj" TEXT;

-- CreateIndex
CREATE INDEX "acteurs_etatMaj_idx" ON "acteurs"("etatMaj");
