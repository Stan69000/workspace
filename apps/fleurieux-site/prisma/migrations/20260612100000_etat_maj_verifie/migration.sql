-- Ajoute l'état "VERIFIE" (fiche vérifiée, source dans noteMaj) à l'enum EtatMaj.
ALTER TYPE "EtatMaj" ADD VALUE 'VERIFIE' BEFORE 'MODIFIE';
