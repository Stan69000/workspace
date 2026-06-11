// src/lib/auth-client.ts
// Client Better Auth pour le navigateur (même origine → /api/auth).
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient()
export const { signIn, signOut, useSession } = authClient
