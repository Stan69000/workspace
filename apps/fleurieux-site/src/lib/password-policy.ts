// src/lib/password-policy.ts
// SEC-017 : politique de mot de passe centralisée (longueur + dictionnaire de fuites).
// Utilisée côté serveur dans le hook Better Auth (auth.ts) et dans le seed.

import { LEAKED_PASSWORDS } from './leaked-passwords'

export const MIN_PASSWORD_LENGTH = 12
export const MAX_PASSWORD_LENGTH = 128

export type PasswordCheck =
  | { ok: true }
  | { ok: false; reason: string }

// Normalisation pour le matching dictionnaire : minuscules + retrait des espaces
// de bord. On ne « désuffixe » pas (123, !, année) volontairement — le dictionnaire
// contient déjà les variantes les plus courantes, et on évite les faux positifs.
function normalize(password: string): string {
  return password.trim().toLowerCase()
}

export function isLeakedPassword(password: string): boolean {
  return LEAKED_PASSWORDS.has(normalize(password))
}

export function checkPasswordStrength(password: string): PasswordCheck {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, reason: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.` }
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, reason: `Le mot de passe ne doit pas dépasser ${MAX_PASSWORD_LENGTH} caractères.` }
  }
  if (isLeakedPassword(password)) {
    return { ok: false, reason: 'Ce mot de passe figure dans une fuite de données connue. Choisissez-en un autre.' }
  }
  return { ok: true }
}
