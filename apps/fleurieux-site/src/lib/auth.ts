// src/lib/auth.ts

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

// NEW-003 : BETTER_AUTH_SECRET doit être défini avant le démarrage
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET env var manquant')
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET,

  // Origines autorisées (corrige « Invalid origin »). Dev + domaine de prod.
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    ...(process.env.NEXT_PUBLIC_BASE_URL ? [process.env.NEXT_PUBLIC_BASE_URL] : []),
  ],

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    // Les mots de passe sont hachés en bcrypt (cf. prisma/seed.ts) — on aligne Better Auth dessus.
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
})

export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
