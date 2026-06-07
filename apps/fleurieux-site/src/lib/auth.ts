// src/lib/auth.ts

import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma'

const secret = process.env.BETTER_AUTH_SECRET
// Pendant le build Next.js, les modules sont chargés sans env de prod
if (!secret && process.env.NEXT_PHASE !== 'phase-production-build') {
  throw new Error('BETTER_AUTH_SECRET env var manquant')
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: secret ?? 'build-placeholder',

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
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
