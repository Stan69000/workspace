// src/lib/admin-guard.ts
import { auth } from '@/lib/auth'

const STAFF = ['ADMIN', 'MODERATEUR']

// Renvoie la session si l'utilisateur est ADMIN ou MODERATEUR, sinon null.
export async function requireStaff(headers: Headers) {
  const session = await auth.api.getSession({ headers }).catch(() => null)
  if (!session || !STAFF.includes(session.user.role as string)) return null
  return session
}

// Renvoie la session si l'utilisateur est ADMIN, sinon null.
export async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers }).catch(() => null)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}
