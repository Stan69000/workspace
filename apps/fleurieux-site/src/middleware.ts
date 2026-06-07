// src/middleware.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// SEC-011 : permissions granulaires par sous-chemin (préfixes les plus longs d'abord)
const ROUTE_ROLES: [string, string[]][] = [
  ['/admin/contributeurs', ['ADMIN']],
  ['/admin/parametres',    ['ADMIN']],
  ['/admin/avis',          ['ADMIN', 'MODERATEUR']],
  ['/admin',               ['ADMIN', 'MODERATEUR', 'CONTRIBUTEUR']],
]

function requiredRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of ROUTE_ROLES) {
    if (pathname.startsWith(prefix)) return roles
  }
  return null
}

// SEC-004 : CSP avec nonce par requête
function buildCsp(nonce: string): string {
  const scriptSrc = process.env.NODE_ENV === 'development'
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}'`

  return [
    "default-src 'self'",
    scriptSrc,
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline'`,
    "img-src 'self' data: https://images.unsplash.com https://fleurieux.info https://*.tile.openstreetmap.org",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  const nonce = btoa(String.fromCharCode(...arr))
  const csp = buildCsp(nonce)

  // Transmettre le nonce à toutes les requêtes (public et protégées)
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

  const roles = requiredRoles(pathname)

  if (!roles) {
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    res.headers.set('Content-Security-Policy', csp)
    return res
  }

  const session = await auth.api.getSession({ headers: req.headers })

  if (!session) {
    // SEC-003 : callbackUrl strictement relatif (défense contre open redirect)
    const safeCallback = pathname.startsWith('/') && !pathname.startsWith('//') ? pathname : '/'
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', safeCallback)
    return NextResponse.redirect(loginUrl)
  }

  const role = session.user.role as string | undefined
  if (!role || !roles.includes(role)) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } })
  res.headers.set('Content-Security-Policy', csp)
  return res
}

export const config = {
  // Couvre toutes les routes HTML, exclut les assets statiques
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
