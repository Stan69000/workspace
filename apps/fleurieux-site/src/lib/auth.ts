// src/lib/auth.ts

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { twoFactor } from 'better-auth/plugins'
import { createAuthMiddleware, APIError } from 'better-auth/api'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { checkPasswordStrength, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from './password-policy'

// NEW-003 : BETTER_AUTH_SECRET doit être défini avant le démarrage
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET env var manquant')
}

// H2 : origines de confiance pour les contrôles CSRF/origin de Better Auth.
// La prod ajoute automatiquement NEXT_PUBLIC_BASE_URL (ex. https://fleurieux.info).
const trustedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  process.env.NEXT_PUBLIC_BASE_URL,
  process.env.BETTER_AUTH_URL,
].filter((o): o is string => Boolean(o))

// SEC-017 : refus des mots de passe leakés / trop courts AVANT tout traitement.
// Intercepte les points d'entrée qui définissent un NOUVEAU mot de passe
// (sign-up, change, reset). Les routes /two-factor/* ne reçoivent que le mot de
// passe courant pour ré-authentification, jamais un nouveau — donc on ne les touche pas.
const enforcePasswordPolicy = createAuthMiddleware(async (ctx) => {
  if (ctx.path !== '/sign-up/email' && ctx.path !== '/change-password' && ctx.path !== '/reset-password') {
    return
  }
  const body = (ctx.body ?? {}) as Record<string, unknown>
  const candidate = body.newPassword ?? body.password
  if (typeof candidate !== 'string') return

  const result = checkPasswordStrength(candidate)
  if (!result.ok) {
    throw new APIError('BAD_REQUEST', { message: result.reason })
  }
})

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins,

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    maxPasswordLength: MAX_PASSWORD_LENGTH,
    // C1 : le seed historique hashe en bcrypt (providerId 'credential'). Better Auth
    // utilise scrypt par défaut, ce qui cassait la vérification. On aligne le hash/verify
    // sur bcryptjs pour que le compte seedé fonctionne et rester cohérent.
    password: {
      hash: (password) => bcrypt.hash(password, 12),
      verify: ({ password, hash }) => bcrypt.compare(password, hash),
    },
  },

  // SEC-005 : session réduite à 7 jours (était 30)
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'HABITANT',
      },
      prenom: {
        type: 'string',
        required: false,
      },
    },
  },

  // SEC-018 : 2FA TOTP (application authenticator) + codes de secours.
  plugins: [
    twoFactor({
      issuer: 'Fleurieux-sur-l\'Arbresle',
      // skipVerificationOnEnable: false → l'activation n'est effective qu'après
      // vérification d'un premier code TOTP (évite de se verrouiller dehors).
    }),
  ],

  hooks: {
    before: enforcePasswordPolicy,
  },

  advanced: {
    // Cookies httpOnly + sameSite=lax par défaut ; on force le flag Secure en prod.
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
